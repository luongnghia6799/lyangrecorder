import fixWebmDuration from 'fix-webm-duration';
import { RecordingSession, VideoStyleSettings, ExportSettings } from '../types';
import { renderFrame, getCanvasDimensions } from './renderer';

export interface ExportProgress {
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  status: string;
}

export interface ExportResult {
  blob: Blob;
  mimeType: string;
  extension: 'mp4' | 'webm';
}

export async function exportRenderedVideo(
  sourceVideoElement: HTMLVideoElement | null,
  session: RecordingSession,
  settings: VideoStyleSettings,
  exportSettings: ExportSettings,
  onProgress: (p: ExportProgress) => void
): Promise<ExportResult> {
  const videoSrc = session.videoUrl || (sourceVideoElement ? sourceVideoElement.src : '');
  if (!videoSrc) {
    throw new Error('Không tìm thấy nguồn video để xuất.');
  }

  // 1. Determine output canvas dimensions
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

  const exportW = Math.round((dims.width * scaleFactor) / 2) * 2;
  const exportH = Math.round((dims.height * scaleFactor) / 2) * 2;

  const fps = exportSettings.fps || 60;
  const rawDuration = session.duration || (sourceVideoElement ? sourceVideoElement.duration : 10);
  const totalDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 10;
  const totalFrames = Math.max(1, Math.round(totalDuration * fps));

  let bitrate = 12000000; // 12 Mbps for 1080p
  if (exportSettings.resolution === '1440p') bitrate = 24000000;
  if (exportSettings.resolution === '4k') bitrate = 48000000;
  if (exportSettings.resolution === '720p') bitrate = 6000000;

  // 2. Setup offscreen canvas
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = exportW;
  offscreenCanvas.height = exportH;
  const offscreenCtx = offscreenCanvas.getContext('2d', { 
    alpha: false,
    desynchronized: true,
  })!;

  // 3. Create dedicated video element attached to DOM with active dimensions so GPU decoder decodes every frame
  const renderVideo = document.createElement('video');
  renderVideo.src = videoSrc;
  renderVideo.crossOrigin = 'anonymous';
  renderVideo.playsInline = true;
  renderVideo.preload = 'auto';
  renderVideo.muted = settings.muteAudio;
  renderVideo.playbackRate = 1.0;
  renderVideo.style.position = 'fixed';
  renderVideo.style.bottom = '0px';
  renderVideo.style.right = '0px';
  renderVideo.style.width = '640px';
  renderVideo.style.height = '360px';
  renderVideo.style.opacity = '0.001';
  renderVideo.style.pointerEvents = 'none';
  renderVideo.style.zIndex = '-9999';
  document.body.appendChild(renderVideo);

  // Determine supported mime type based on user-selected format
  const mp4Mimes = [
    'video/mp4;codecs=avc1.4d401f,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];
  const webmMimes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  let selectedMime = 'video/webm';
  let targetExtension: 'mp4' | 'webm' = 'webm';

  if (exportSettings.format === 'mp4') {
    for (const mime of mp4Mimes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        targetExtension = 'mp4';
        break;
      }
    }
    // If browser doesn't support MP4 MediaRecorder, fallback to WebM
    if (targetExtension !== 'mp4') {
      for (const mime of webmMimes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          targetExtension = 'webm';
          break;
        }
      }
    }
  } else {
    for (const mime of webmMimes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        targetExtension = 'webm';
        break;
      }
    }
    if (targetExtension !== 'webm') {
      for (const mime of mp4Mimes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          targetExtension = 'mp4';
          break;
        }
      }
    }
  }

  const stream = offscreenCanvas.captureStream(fps);

  // Hook up audio track if video has sound
  let audioContext: AudioContext | null = null;
  if (!settings.muteAudio) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        const sourceNode = audioContext.createMediaElementSource(renderVideo);
        const destNode = audioContext.createMediaStreamDestination();
        sourceNode.connect(destNode);
        if (destNode.stream.getAudioTracks().length > 0) {
          destNode.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      }
    } catch (err) {
      console.warn('AudioContext media element capture warning:', err);
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
    let animId: number | null = null;
    let rvfcId: number | null = null;
    let isFinished = false;

    const cleanup = () => {
      isFinished = true;
      if (animId !== null) cancelAnimationFrame(animId);
      if (rvfcId !== null && 'cancelVideoFrameCallback' in renderVideo) {
        (renderVideo as any).cancelVideoFrameCallback(rvfcId);
      }
      renderVideo.pause();
      if (renderVideo.parentNode) {
        renderVideo.parentNode.removeChild(renderVideo);
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };

    recorder.onstop = async () => {
      try {
        const rawBlob = new Blob(recordedChunks, { type: selectedMime });
        let finalBlob = rawBlob;

        // Fix WebM duration metadata so video players (Windows Media Player, VLC, QuickTime) have correct duration and smooth seek
        if (selectedMime.includes('webm') || targetExtension === 'webm') {
          onProgress({
            progress: 99,
            currentFrame: totalFrames,
            totalFrames,
            status: 'Đang hoàn thiện metadata thời lượng video...',
          });

          try {
            const durationMs = Math.max(1000, Math.round(totalDuration * 1000));
            finalBlob = await fixWebmDuration(rawBlob, durationMs);
          } catch (fixErr) {
            console.warn('fixWebmDuration error, keeping raw blob:', fixErr);
          }
        }

        cleanup();

        onProgress({
          progress: 100,
          currentFrame: totalFrames,
          totalFrames,
          status: 'Xuất video hoàn tất 100%! Sẵn sàng tải về 🎉',
        });

        resolve({
          blob: finalBlob,
          mimeType: selectedMime,
          extension: targetExtension,
        });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    recorder.onerror = (err) => {
      cleanup();
      reject(err);
    };

    try {
      // 1. Wait for video metadata & first frame to be decoded
      await new Promise<void>((res) => {
        const timeout = setTimeout(res, 3000);
        const checkReady = () => {
          if (renderVideo.readyState >= 2) {
            clearTimeout(timeout);
            res();
          }
        };
        renderVideo.addEventListener('loadeddata', checkReady, { once: true });
        renderVideo.addEventListener('canplay', checkReady, { once: true });
        renderVideo.load();
        if (renderVideo.readyState >= 2) {
          clearTimeout(timeout);
          res();
        }
      });

      renderVideo.currentTime = 0;

      // Wait until seeked to 0
      await new Promise<void>((res) => {
        if (renderVideo.currentTime === 0 && renderVideo.readyState >= 2) {
          res();
          return;
        }
        const onSeeked = () => {
          renderVideo.removeEventListener('seeked', onSeeked);
          res();
        };
        renderVideo.addEventListener('seeked', onSeeked, { once: true });
        renderVideo.currentTime = 0;
        setTimeout(res, 300);
      });

      // 2. Render initial frame onto canvas before starting recorder
      renderFrame(
        offscreenCtx,
        renderVideo,
        session,
        settings,
        0,
        exportW,
        exportH
      );

      // 3. Start MediaRecorder
      recorder.start(100);

      // 4. Start smooth continuous playback
      await renderVideo.play();

      const drawLoop = () => {
        if (isFinished) return;

        const curTime = renderVideo.currentTime;

        renderFrame(
          offscreenCtx,
          renderVideo,
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
          status: `Đang render tốc độ cao (${progressPct}%) • ${curTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`,
        });

        // Check if finished
        if (renderVideo.ended || curTime >= totalDuration - 0.05) {
          isFinished = true;
          renderVideo.pause();
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, 150);
          return;
        }

        animId = requestAnimationFrame(drawLoop);
      };

      animId = requestAnimationFrame(drawLoop);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}



