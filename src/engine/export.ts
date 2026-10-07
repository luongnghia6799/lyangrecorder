import { Muxer as Mp4Muxer, ArrayBufferTarget } from 'mp4-muxer';
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

  // 1. Determine output canvas dimensions (even dimensions required by H.264)
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

  // Wait for video element readiness
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

  const isWebCodecsSupported = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

  // =========================================================================
  // PIPELINE A: Standard FastStart MP4 via WebCodecs VideoEncoder + mp4-muxer
  // =========================================================================
  if (exportSettings.format === 'mp4' && isWebCodecsSupported) {
    try {
      const muxer = new Mp4Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: exportW,
          height: exportH,
        },
        fastStart: 'in-memory',
      });

      let encodeError: any = null;
      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => {
          console.error('VideoEncoder error:', e);
          encodeError = e;
        },
      });

      await videoEncoder.configure({
        codec: 'avc1.4d002a', // H.264 High Profile Level 4.2
        width: exportW,
        height: exportH,
        bitrate: bitrate,
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
      });

      // Render frame 0
      renderFrame(offscreenCtx, renderVideo, session, settings, 0, exportW, exportH);

      await renderVideo.play();

      return await new Promise<ExportResult>((resolve, reject) => {
        let animId: number | null = null;
        let isFinished = false;
        let frameCount = 0;
        let lastTimestampUs = -1;

        const cleanup = () => {
          isFinished = true;
          if (animId !== null) cancelAnimationFrame(animId);
          renderVideo.pause();
          if (renderVideo.parentNode) {
            renderVideo.parentNode.removeChild(renderVideo);
          }
        };

        const renderLoop = async () => {
          if (isFinished) return;

          if (encodeError) {
            cleanup();
            reject(encodeError);
            return;
          }

          const curTime = renderVideo.currentTime;
          frameCount++;

          // Draw visual composition onto offscreen canvas
          renderFrame(offscreenCtx, renderVideo, session, settings, curTime, exportW, exportH);

          // Timestamp in microseconds
          const timestampUs = Math.round(curTime * 1_000_000);
          if (timestampUs > lastTimestampUs) {
            lastTimestampUs = timestampUs;
            const frame = new VideoFrame(offscreenCanvas, { timestamp: timestampUs });
            const isKeyFrame = frameCount % (fps * 2) === 0 || frameCount === 1;
            videoEncoder.encode(frame, { keyFrame: isKeyFrame });
            frame.close();
          }

          const progressPct = Math.min(99, Math.round((curTime / totalDuration) * 100));
          onProgress({
            progress: progressPct,
            currentFrame: Math.min(totalFrames, Math.round((curTime / totalDuration) * totalFrames)),
            totalFrames,
            status: `Đang xuất MP4 siêu nét 60 FPS (${progressPct}%) • ${curTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`,
          });

          // Finished condition
          if (renderVideo.ended || curTime >= totalDuration - 0.05) {
            isFinished = true;
            renderVideo.pause();

            try {
              onProgress({
                progress: 99,
                currentFrame: totalFrames,
                totalFrames,
                status: 'Đang đóng gói file MP4 FastStart...',
              });

              await videoEncoder.flush();
              videoEncoder.close();
              muxer.finalize();
              cleanup();

              const mp4Blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });

              onProgress({
                progress: 100,
                currentFrame: totalFrames,
                totalFrames,
                status: 'Xuất video hoàn tất 100%! Sẵn sàng tải về 🎉',
              });

              resolve({
                blob: mp4Blob,
                mimeType: 'video/mp4',
                extension: 'mp4',
              });
            } catch (err) {
              cleanup();
              reject(err);
            }
            return;
          }

          animId = requestAnimationFrame(renderLoop);
        };

        animId = requestAnimationFrame(renderLoop);
      });
    } catch (mp4MuxerErr) {
      console.warn('WebCodecs MP4 muxer failed, falling back to MediaRecorder:', mp4MuxerErr);
    }
  }

  // =========================================================================
  // PIPELINE B: WebM / MediaRecorder Fallback with fixWebmDuration
  // =========================================================================
  const candidateMimes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];

  let selectedMime = 'video/webm';
  let targetExtension: 'mp4' | 'webm' = 'webm';

  for (const mime of candidateMimes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime;
      targetExtension = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      break;
    }
  }

  const stream = offscreenCanvas.captureStream(fps);

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
      console.warn('AudioContext warning:', err);
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
    let isFinished = false;

    const cleanup = () => {
      isFinished = true;
      if (animId !== null) cancelAnimationFrame(animId);
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

        if (selectedMime.includes('webm') || targetExtension === 'webm') {
          onProgress({
            progress: 99,
            currentFrame: totalFrames,
            totalFrames,
            status: 'Đang vá metadata thời lượng video...',
          });

          try {
            const durationMs = Math.max(1000, Math.round(totalDuration * 1000));
            finalBlob = await fixWebmDuration(rawBlob, durationMs);
          } catch (fixErr) {
            console.warn('fixWebmDuration error:', fixErr);
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
      renderFrame(offscreenCtx, renderVideo, session, settings, 0, exportW, exportH);
      recorder.start(100);
      await renderVideo.play();

      const drawLoop = () => {
        if (isFinished) return;

        const curTime = renderVideo.currentTime;

        renderFrame(offscreenCtx, renderVideo, session, settings, curTime, exportW, exportH);

        const progressPct = Math.min(99, Math.round((curTime / totalDuration) * 100));
        onProgress({
          progress: progressPct,
          currentFrame: Math.min(totalFrames, Math.round((curTime / totalDuration) * totalFrames)),
          totalFrames,
          status: `Đang render (${progressPct}%) • ${curTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`,
        });

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




