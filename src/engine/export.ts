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

// Helper to seek video element to a specific timestamp and wait until frame is fully decoded
function seekVideoTo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - timeSec) < 0.005) {
      resolve();
      return;
    }

    let timeoutId: any = null;

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      if (timeoutId) clearTimeout(timeoutId);
      resolve();
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = timeSec;

    // Safety timeout in case seeked doesn't fire
    timeoutId = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }, 150);
  });
}

export async function exportRenderedVideo(
  sourceVideoElement: HTMLVideoElement | null,
  session: RecordingSession,
  settings: VideoStyleSettings,
  exportSettings: ExportSettings,
  onProgress: (p: ExportProgress) => void
): Promise<ExportResult> {
  if (!session.videoUrl && !sourceVideoElement) {
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

  // Ensure width and height are even numbers (required by H.264 encoders)
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
    desynchronized: false,
    willReadFrequently: false 
  })!;

  // 3. Create dedicated video element attached to DOM with non-zero dimensions to ensure hardware texture decode
  const renderVideo = document.createElement('video');
  renderVideo.src = session.videoUrl || (sourceVideoElement ? sourceVideoElement.src : '');
  renderVideo.crossOrigin = 'anonymous';
  renderVideo.playsInline = true;
  renderVideo.preload = 'auto';
  renderVideo.muted = true;
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
  await new Promise<void>((resolve) => {
    if (renderVideo.readyState >= 2) {
      resolve();
      return;
    }
    const onLoaded = () => {
      resolve();
    };
    renderVideo.addEventListener('loadeddata', onLoaded, { once: true });
    renderVideo.addEventListener('canplay', onLoaded, { once: true });
    renderVideo.load();
    setTimeout(resolve, 2000);
  });

  const cleanup = () => {
    renderVideo.pause();
    if (renderVideo.parentNode) {
      renderVideo.parentNode.removeChild(renderVideo);
    }
  };

  const isWebCodecsSupported = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

  // METHOD 1: WebCodecs + mp4-muxer (Deterministic Frame-by-Frame, Ultra Crisp, 100% Valid MP4 with Faststart)
  if (isWebCodecsSupported && exportSettings.format === 'mp4') {
    try {
      onProgress({
        progress: 1,
        currentFrame: 0,
        totalFrames,
        status: `Khởi tạo phần cứng H.264 GPU (${exportW}x${exportH} @ ${fps}FPS)...`,
      });

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
          console.error('VideoEncoder internal error:', e);
          encodeError = e;
        },
      });

      // Configure H.264 codec profile
      await videoEncoder.configure({
        codec: 'avc1.4d002a', // High Profile Level 4.2
        width: exportW,
        height: exportH,
        bitrate: bitrate,
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
      });

      // Frame-by-frame deterministic rendering
      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        if (encodeError) throw encodeError;

        const timeSec = frameIdx / fps;
        const timestampUs = Math.round(timeSec * 1_000_000);

        // Seek video frame
        await seekVideoTo(renderVideo, timeSec);

        // Render Studio visual composition
        renderFrame(
          offscreenCtx,
          renderVideo,
          session,
          settings,
          timeSec,
          exportW,
          exportH
        );

        // Create VideoFrame from canvas and pass to hardware encoder
        const frame = new VideoFrame(offscreenCanvas, { timestamp: timestampUs });
        const isKeyFrame = frameIdx % (fps * 2) === 0; // Keyframe every 2 seconds
        videoEncoder.encode(frame, { keyFrame: isKeyFrame });
        frame.close();

        // Report smooth progress
        const pct = Math.min(99, Math.round(((frameIdx + 1) / totalFrames) * 100));
        if (frameIdx % 5 === 0 || frameIdx === totalFrames - 1) {
          onProgress({
            progress: pct,
            currentFrame: frameIdx + 1,
            totalFrames,
            status: `Đang render từng khung hình (${pct}%) • ${timeSec.toFixed(1)}s / ${totalDuration.toFixed(1)}s`,
          });
          // Yield to UI event loop
          await new Promise((r) => setTimeout(r, 0));
        }
      }

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

      return {
        blob: mp4Blob,
        mimeType: 'video/mp4',
        extension: 'mp4',
      };
    } catch (webCodecsErr) {
      console.warn('WebCodecs encoder failed, falling back to MediaRecorder pipeline:', webCodecsErr);
    }
  }

  // METHOD 2: MediaRecorder fallback with fixWebmDuration
  return new Promise(async (resolve, reject) => {
    let animId: number | null = null;
    let isFinished = false;

    const fallbackCleanup = () => {
      isFinished = true;
      if (animId !== null) cancelAnimationFrame(animId);
      cleanup();
    };

    const candidateMimes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
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
    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMime,
      videoBitsPerSecond: bitrate,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
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
            status: 'Đang tối ưu hóa duration metadata WebM...',
          });
          try {
            const durationMs = Math.max(1000, Math.round(totalDuration * 1000));
            finalBlob = await fixWebmDuration(rawBlob, durationMs);
          } catch (fixErr) {
            console.warn('fixWebmDuration error:', fixErr);
          }
        }

        fallbackCleanup();

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
        fallbackCleanup();
        reject(err);
      }
    };

    recorder.onerror = (err) => {
      fallbackCleanup();
      reject(err);
    };

    try {
      renderVideo.currentTime = 0;
      await seekVideoTo(renderVideo, 0);

      renderFrame(
        offscreenCtx,
        renderVideo,
        session,
        settings,
        0,
        exportW,
        exportH
      );

      recorder.start(100);
      await renderVideo.play();

      const renderLoop = () => {
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

        animId = requestAnimationFrame(renderLoop);
      };

      animId = requestAnimationFrame(renderLoop);
    } catch (err) {
      fallbackCleanup();
      reject(err);
    }
  });
}


