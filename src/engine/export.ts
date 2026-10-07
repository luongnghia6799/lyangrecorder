import { RecordingSession, VideoStyleSettings, ExportSettings } from '../types';
import { renderFrame, getCanvasDimensions } from './renderer';

export interface ExportProgress {
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  status: string;
}

export async function exportRenderedVideo(
  videoElement: HTMLVideoElement,
  session: RecordingSession,
  settings: VideoStyleSettings,
  exportSettings: ExportSettings,
  onProgress: (p: ExportProgress) => void
): Promise<Blob> {
  // Determine output dimensions
  const dims = getCanvasDimensions(settings.aspectRatio);
  let scaleFactor = 1;

  if (exportSettings.resolution === '720p') {
    scaleFactor = 720 / dims.height;
  } else if (exportSettings.resolution === '1080p') {
    scaleFactor = 1080 / dims.height;
  } else if (exportSettings.resolution === '1440p') {
    scaleFactor = 1440 / dims.height;
  } else if (exportSettings.resolution === '4k') {
    scaleFactor = 2160 / dims.height;
  }

  const exportW = Math.round(dims.width * scaleFactor);
  const exportH = Math.round(dims.height * scaleFactor);

  // Setup offscreen canvas
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = exportW;
  offscreenCanvas.height = exportH;
  const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: false })!;

  const fps = exportSettings.fps || 60;
  const rawDuration = session.duration || videoElement.duration || 10;
  const totalDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 10;
  const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

  // Determine bitrate based on resolution
  let bitrate = 10000000; // 10 Mbps for 1080p
  if (exportSettings.resolution === '1440p') bitrate = 20000000;
  if (exportSettings.resolution === '4k') bitrate = 40000000;

  const stream = offscreenCanvas.captureStream(fps);

  // If source video has audio, capture audio track
  try {
    const streamTracks = (videoElement as any).captureStream
      ? (videoElement as any).captureStream().getAudioTracks()
      : (videoElement as any).mozCaptureStream
      ? (videoElement as any).mozCaptureStream().getAudioTracks()
      : [];

    if (streamTracks.length > 0 && !settings.muteAudio) {
      streamTracks.forEach((t: MediaStreamTrack) => stream.addTrack(t));
    }
  } catch (err) {
    console.warn('Audio track capture not available on this stream', err);
  }

  const mimeTypes = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  let selectedMime = 'video/webm';
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime;
      if (exportSettings.format === 'mp4' && mime.startsWith('video/mp4')) {
        break;
      }
      if (exportSettings.format === 'webm' && mime.startsWith('video/webm')) {
        break;
      }
    }
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: bitrate,
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  return new Promise(async (resolve, reject) => {
    let animId: number;
    let isFinished = false;

    const cleanup = () => {
      isFinished = true;
      if (animId) cancelAnimationFrame(animId);
      videoElement.pause();
      videoElement.currentTime = 0;
      videoElement.playbackRate = settings.playbackSpeed || 1.0;
    };

    recorder.onstop = () => {
      cleanup();
      const outputBlob = new Blob(recordedChunks, { type: selectedMime });
      onProgress({
        progress: 100,
        currentFrame: totalFrames,
        totalFrames,
        status: 'Xuất video hoàn tất 100%! Sẵn sàng tải về 🎉',
      });
      resolve(outputBlob);
    };

    recorder.onerror = (err) => {
      cleanup();
      reject(err);
    };

    try {
      // 1. Reset video to start
      videoElement.currentTime = 0;
      videoElement.muted = settings.muteAudio;
      videoElement.playbackRate = 1.0;

      // Wait until video is seeked to start
      await new Promise<void>((r) => {
        if (videoElement.readyState >= 2 && videoElement.currentTime === 0) {
          r();
          return;
        }
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          r();
        };
        videoElement.addEventListener('seeked', onSeeked);
        videoElement.currentTime = 0;
      });

      // 2. Draw initial frame onto canvas before starting recorder
      renderFrame(
        offscreenCtx,
        videoElement,
        session,
        settings,
        0,
        exportW,
        exportH
      );

      // 3. Start MediaRecorder
      recorder.start(100);

      // 4. Start fast playback render loop
      await videoElement.play();

      let frameCount = 0;

      const renderLoop = () => {
        if (isFinished) return;

        const curTime = videoElement.currentTime;
        frameCount++;

        renderFrame(
          offscreenCtx,
          videoElement,
          session,
          settings,
          curTime,
          exportW,
          exportH
        );

        const progressPct = Math.min(99, Math.round((curTime / totalDuration) * 100));
        onProgress({
          progress: progressPct,
          currentFrame: Math.min(totalFrames, Math.round((curTime / totalDuration) * totalFrames)),
          totalFrames,
          status: `Đang render siêu tốc (${progressPct}%) • ${curTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`,
        });

        // Check if finished
        if (videoElement.ended || curTime >= totalDuration - 0.08) {
          isFinished = true;
          videoElement.pause();
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, 150);
          return;
        }

        animId = requestAnimationFrame(renderLoop);
      };

      animId = requestAnimationFrame(renderLoop);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}
