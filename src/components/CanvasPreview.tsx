import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RecordingSession, VideoStyleSettings, ZoomBlock } from '../types';
import { renderFrame, getCanvasDimensions } from '../engine/renderer';
import { Timeline } from './Timeline';
import { 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Cpu, 
  Video, 
  Upload, 
  Sparkles, 
  Keyboard, 
  MousePointer,
  HardDrive
} from 'lucide-react';

interface CanvasPreviewProps {
  session: RecordingSession;
  settings: VideoStyleSettings;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onUpdateZoomBlock: (updated: ZoomBlock) => void;
  onSeek: (time: number) => void;
  onAddZoomBlock: () => void;
  onDeleteZoomBlock?: (id: string) => void;
  onSelectZoomBlock: (id: string | null) => void;
  onAutoDetectZoom: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isRecordingActive?: boolean;
  onOpenRecorder?: () => void;
  onOpenRawSave?: () => void;
  onImportVideo?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  session,
  settings,
  onTimeUpdate,
  onTogglePlay,
  onUpdateZoomBlock,
  onSeek,
  onAddZoomBlock,
  onDeleteZoomBlock,
  onSelectZoomBlock,
  onAutoDetectZoom,
  videoRef,
  isRecordingActive = false,
  onOpenRecorder,
  onOpenRawSave,
  onImportVideo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoomBadgeRef = useRef<HTMLSpanElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const prevVideoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (session.videoUrl && session.videoUrl !== prevVideoUrlRef.current) {
      prevVideoUrlRef.current = session.videoUrl;
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session.videoUrl]);

  // Refs for zero-allocation rendering loop
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const selectedBlock = session.zoomBlocks.find((b) => b.id === session.selectedBlockId);
  const hasVideo = Boolean(session.videoUrl);

  // Compute optimal canvas preview dimensions
  const getPreviewDims = useCallback(() => {
    const base = getCanvasDimensions(settings.aspectRatio);
    const scale = 1280 / base.width;
    return {
      width: Math.round(base.width * scale),
      height: Math.round(base.height * scale),
    };
  }, [settings.aspectRatio]);

  // Render a single static frame (Used when video is paused or during playback)
  const drawFrame = useCallback((overrideTime?: number) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !hasVideo || isRecordingActive) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const dims = getPreviewDims();
    if (canvas.width !== dims.width || canvas.height !== dims.height) {
      canvas.width = dims.width;
      canvas.height = dims.height;
    }

    const curTime = overrideTime ?? (sessionRef.current.isPlaying ? video.currentTime : sessionRef.current.currentTime);

    const { camera } = renderFrame(
      ctx,
      video,
      sessionRef.current,
      settingsRef.current,
      curTime,
      dims.width,
      dims.height
    );

    // Direct DOM text update - ZERO React component re-renders during playback
    if (zoomBadgeRef.current) {
      const targetText = `Zoom: ${camera.zoom.toFixed(2)}x`;
      if (zoomBadgeRef.current.textContent !== targetText) {
        zoomBadgeRef.current.textContent = targetText;
      }
    }
  }, [getPreviewDims, hasVideo, isRecordingActive, videoRef]);

  // When paused: render ONCE when state/settings/time changes
  useEffect(() => {
    if (!session.isPlaying && !isRecordingActive && hasVideo) {
      drawFrame();
    }
  }, [
    session.isPlaying, 
    session.currentTime, 
    session.selectedBlockId, 
    session.zoomBlocks, 
    session.videoUrl, 
    settings, 
    isRecordingActive, 
    hasVideo,
    drawFrame
  ]);

  // Trigger draw when video element metadata & first frame are loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    const onReady = () => {
      drawFrame();
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('canplay', onReady);
    video.addEventListener('seeked', onReady);

    if (video.readyState >= 2) {
      drawFrame();
    }

    return () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('seeked', onReady);
    };
  }, [hasVideo, session.videoUrl, videoRef, drawFrame]);

  // When playing: High-performance loop synced with hardware video frame decoding
  useEffect(() => {
    if (!session.isPlaying || isRecordingActive || !hasVideo) return;

    const video = videoRef.current;
    if (!video) return;

    let isCancelled = false;
    let rvfcId: number | null = null;
    let rafId: number | null = null;

    // Use requestVideoFrameCallback (Chromium hardware decoder sync)
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      const onVideoFrame = () => {
        if (isCancelled) return;
        if (video && !video.paused) {
          drawFrame(video.currentTime);
          onTimeUpdateRef.current(video.currentTime);
          rvfcId = (video as any).requestVideoFrameCallback(onVideoFrame);
        }
      };
      rvfcId = (video as any).requestVideoFrameCallback(onVideoFrame);
    } else {
      let lastTime = 0;
      const loop = (timestamp: number) => {
        if (isCancelled) return;
        if (timestamp - lastTime >= 16) {
          if (video && !video.paused) {
            drawFrame(video.currentTime);
            onTimeUpdateRef.current(video.currentTime);
            lastTime = timestamp;
          }
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      isCancelled = true;
      if (rvfcId !== null && video && 'cancelVideoFrameCallback' in video) {
        (video as any).cancelVideoFrameCallback(rvfcId);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [session.isPlaying, isRecordingActive, hasVideo, drawFrame, videoRef]);

  // Handle drag to adjust zoom focal point on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedBlock || !canvasRef.current) return;
    setIsDraggingTarget(true);
    updateTargetFromMouse(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingTarget || !selectedBlock) return;
    updateTargetFromMouse(e);
  };

  const handleMouseUp = () => {
    setIsDraggingTarget(false);
  };

  const updateTargetFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectedBlock) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const targetX = Math.max(0.05, Math.min(0.95, clickX));
    const targetY = Math.max(0.05, Math.min(0.95, clickY));

    onUpdateZoomBlock({
      ...selectedBlock,
      targetX: Number(targetX.toFixed(3)),
      targetY: Number(targetY.toFixed(3)),
    });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full floating-island p-4 flex flex-col items-center justify-between relative overflow-hidden select-none transition-all duration-200"
    >
      {/* Top Floating Pill Banner inside Canvas Card */}
      <div className="w-full flex items-center justify-between pb-3 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-card-inner)] border border-[var(--border-inner)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)]">
              Canvas Studio
            </span>
          </div>

          {selectedBlock && hasVideo && (
            <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-fade-in shadow-xs">
              <Crosshair size={14} />
              <span>Tâm Zoom: {(selectedBlock.targetX * 100).toFixed(0)}%, {(selectedBlock.targetY * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {hasVideo && (
            <span 
              ref={zoomBadgeRef}
              className="text-xs font-mono font-extrabold text-[var(--accent-primary)] px-3.5 py-1.5 rounded-full bg-[var(--bg-card-highlight)] border border-[var(--border-inner)] shadow-xs"
            >
              Zoom: 1.00x
            </span>
          )}

          {/* Download Raw Video Button */}
          {onOpenRawSave && (
            <button
              onClick={onOpenRawSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card-inner)] hover:bg-[var(--border-inner)] border border-[var(--border-inner)] text-[var(--text-main)] text-xs font-bold shadow-xs transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
              title="Tải video gốc (Raw) chưa xử lý hoặc cài đặt thư mục lưu mặc định"
            >
              <HardDrive size={14} className="text-[var(--accent-primary)]" />
              <span>Tải Raw</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card-inner)] border border-[var(--border-inner)] text-xs font-bold text-[var(--text-muted)]">
            <Cpu size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">GPU 60fps</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-[var(--bg-card-inner)] hover:bg-[var(--border-inner)] border border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all duration-150 cursor-pointer active:scale-90"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && onImportVideo) {
            const fakeEvent = { target: { files: [file] } } as any;
            onImportVideo(fakeEvent);
          }
        }}
        className={`flex-1 w-full flex items-center justify-center relative min-h-0 bg-[var(--bg-card-inner)] rounded-3xl border ${
          isDragOver ? 'border-[var(--accent-primary)] scale-[0.99]' : 'border-[var(--border-inner)]'
        } p-3 overflow-hidden transition-all duration-200`}
      >
        {hasVideo ? (
          <div 
            key={session.videoUrl || 'canvas-preview-wrapper'} 
            className="w-full h-full flex items-center justify-center relative animate-preview-reveal overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-h-full max-w-full rounded-2xl object-contain cursor-crosshair border border-[var(--border-inner)]/40"
              style={{ aspectRatio: settings.aspectRatio === '9:16' ? '9/16' : settings.aspectRatio === '1:1' ? '1/1' : settings.aspectRatio === '4:3' ? '4/3' : '16/9' }}
            />

            {/* Quick Status Pill Toast */}
            {showSuccessToast && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950/90 text-white backdrop-blur-lg border border-white/20 shadow-2xl text-xs font-bold animate-toast-slide-up pointer-events-none z-20">
                <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                <span>Video đã nạp vào Studio — Sẵn sàng chỉnh sửa & Auto-Zoom</span>
              </div>
            )}
          </div>
        ) : (
          /* Empty Studio Workspace Dropzone */
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0D6832] via-[#00E599] to-[#10B981] p-1 mb-5 flex items-center justify-center">
              <div className="w-full h-full bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--accent-primary)]">
                <Video size={36} />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-2 tracking-tight font-sans">
              Bắt đầu bản ghi màn hình mới
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-7 leading-relaxed font-medium">
              Quay màn hình chất lượng cao hoặc kéo thả file video vào đây để tự động tạo hiệu ứng phóng to thông minh (Auto-Zoom).
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3.5 mb-7">
              {onOpenRecorder && (
                <button
                  onClick={onOpenRecorder}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>Quay màn hình (F9)</span>
                </button>
              )}

              {onImportVideo && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onImportVideo}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold bg-[var(--bg-card)] hover:bg-[var(--border-inner)] border border-[var(--border-inner)] text-[var(--text-main)] shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>Nhập video</span>
                  </button>
                </>
              )}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] shadow-xs">
                <Sparkles size={14} className="text-amber-500" />
                Auto-Zoom mượt mà
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] shadow-xs">
                <Keyboard size={14} className="text-emerald-500" />
                Ghi phím bấm & chuột
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] shadow-xs">
                <MousePointer size={14} className="text-sky-500" />
                Hiệu ứng Click Ripple
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Studio Timeline Multi-Track */}
      <Timeline
        session={session}
        onSeek={onSeek}
        onTogglePlay={onTogglePlay}
        onAddZoomBlock={onAddZoomBlock}
        onDeleteZoomBlock={onDeleteZoomBlock}
        onSelectZoomBlock={onSelectZoomBlock}
        onUpdateZoomBlock={onUpdateZoomBlock}
        onAutoDetectZoom={onAutoDetectZoom}
        videoRef={videoRef}
      />
    </div>
  );
};
