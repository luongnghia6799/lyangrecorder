import React, { useState, useCallback } from 'react';
import { RecordingSession, VideoStyleSettings, ExportSettings } from '../types';
import { exportRenderedVideo, ExportProgress } from '../engine/export';
import { 
  Download, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Film, 
  Loader2,
  FolderOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  session: RecordingSession;
  settings: VideoStyleSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoRef,
  session,
  settings,
}) => {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    resolution: '1080p',
    fps: 60,
    format: 'mp4',
    quality: 'ultra',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exportedExt, setExportedExt] = useState<'mp4' | 'webm'>('webm');

  // Animation & Resize state
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnimatedClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 190);
  }, [onClose]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setDownloadUrl(null);
    setDownloadBlob(null);
    setSavedFilePath(null);
    setProgress({
      progress: 0,
      currentFrame: 0,
      totalFrames: Math.round((session.duration || 10) * exportSettings.fps),
      status: 'Đang chuẩn bị bộ giải mã khung hình video...',
    });

    try {
      const res = await exportRenderedVideo(
        videoRef.current,
        session,
        settings,
        exportSettings,
        (p) => setProgress(p)
      );

      const url = URL.createObjectURL(res.blob);
      setDownloadBlob(res.blob);
      setDownloadUrl(url);
      setExportedExt(res.extension);
      setIsExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const handleSaveVideo = async (blob: Blob | null, url: string | null, defaultFilename: string) => {
    setIsSaving(true);
    const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    if (hasTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        let arrayBuffer: ArrayBuffer;

        if (blob) {
          arrayBuffer = await blob.arrayBuffer();
        } else if (url) {
          const resp = await fetch(url);
          arrayBuffer = await resp.arrayBuffer();
        } else {
          setIsSaving(false);
          return;
        }

        const bytes = Array.from(new Uint8Array(arrayBuffer));
        const savedPath = await invoke<string | null>('save_video_to_disk', {
          defaultName: defaultFilename,
          bytes,
        });

        if (savedPath) {
          setSavedFilePath(savedPath);
          try {
            const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
            await revealItemInDir(savedPath);
          } catch {}
        }
        setIsSaving(false);
        return;
      } catch (err) {
        console.warn('Native save dialog error, falling back to browser download', err);
      }
    }

    // Browser fallback
    const targetUrl = url || (blob ? URL.createObjectURL(blob) : null);
    if (targetUrl) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setIsSaving(false);
  };

  const resolutions: { id: ExportSettings['resolution']; label: string; desc: string; badge?: string }[] = [
    { id: '1080p', label: '1080p Full HD', desc: '1920 × 1080', badge: 'Phổ biến' },
    { id: '1440p', label: '1440p 2K QHD', desc: '2560 × 1440', badge: 'Sắc nét' },
    { id: '4k', label: '4K Ultra HD', desc: '3840 × 2160', badge: 'Chất lượng cao' },
    { id: '720p', label: '720p HD', desc: '1280 × 720', badge: 'Nhẹ' },
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) handleAnimatedClose();
      }}
      className={`fixed inset-0 z-50 bg-black/65 backdrop-blur-lg flex items-center justify-center p-4 select-none ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      <div 
        className={`w-full ${
          isExpanded ? 'max-w-3xl w-[92vw]' : 'max-w-lg'
        } bg-[var(--bg-card)] border-2 border-[var(--border-card)] rounded-3xl shadow-2xl p-6 text-[var(--text-main)] relative transition-all duration-300 ${
          isClosing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        <div className="absolute top-5 right-5 flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-inner)] transition cursor-pointer active:scale-90"
            title={isExpanded ? 'Thu nhỏ kích thước' : 'Phóng to kích thước'}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={handleAnimatedClose}
            disabled={isExporting}
            className="p-2 rounded-full text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-inner)] transition cursor-pointer active:scale-90 disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 mb-6 pr-20">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center shadow-xs shrink-0">
            <Film className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Xuất Video Chất Lượng Cao (Export)</h2>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Render trọn bộ hiệu ứng Smart Zoom, khung viền và chuyển động con trỏ
            </p>
          </div>
        </div>

        {downloadUrl ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)] mx-auto flex items-center justify-center border-2 border-[var(--border-inner)] shadow-md">
              <CheckCircle2 size={44} className="text-[var(--accent-primary)]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[var(--text-main)]">Video Đã Sẵn Sàng!</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Render hoàn tất ở chuẩn {exportSettings.resolution.toUpperCase()} {exportSettings.fps} FPS.
              </p>
            </div>

            {savedFilePath && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 font-mono">
                <FolderOpen size={16} />
                <span className="truncate">Đã lưu: {savedFilePath}</span>
              </div>
            )}

            <button
              onClick={() => handleSaveVideo(downloadBlob, downloadUrl, `lyang-recorder-${Date.now()}.${exportedExt}`)}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2.5 w-full py-4 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] font-extrabold text-sm shadow-lg transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download size={18} />
              <span>{isSaving ? 'Đang mở hộp thoại lưu...' : 'Lưu file Video về máy (Chọn thư mục)'}</span>
            </button>

            <button
              onClick={() => {
                setDownloadUrl(null);
                setDownloadBlob(null);
                setSavedFilePath(null);
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold transition cursor-pointer"
            >
              Xuất ở độ phân giải khác
            </button>
          </div>
        ) : isExporting ? (
          <div className="py-6 space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin mx-auto" />
              <h3 className="text-base font-bold text-[var(--text-main)]">Đang render video...</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">{progress?.status}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-[var(--bg-card-inner)] rounded-full overflow-hidden border border-[var(--border-inner)] p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#0D6832] via-[#00E599] to-[#10B981] rounded-full transition-all duration-150"
                  style={{ width: `${progress?.progress || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono font-bold">
                <span>
                  Frame {progress?.currentFrame} / {progress?.totalFrames}
                </span>
                <span className="text-[var(--accent-primary)]">{progress?.progress}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4.5">
            {/* Resolution Selector */}
            <div className="space-y-2">
              <span className="text-sm font-extrabold text-[var(--text-main)]">Độ phân giải (Resolution)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {resolutions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() =>
                      setExportSettings((s) => ({ ...s, resolution: r.id }))
                    }
                    className={`p-3.5 rounded-2xl text-left transition-all duration-150 border-2 cursor-pointer ${
                      exportSettings.resolution === r.id
                        ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                        : 'border-[var(--border-inner)] bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold font-sans">{r.label}</div>
                      {r.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] text-[var(--text-muted)] font-extrabold">
                          {r.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)] font-mono mt-1">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format & FPS Selectors */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-[var(--text-main)]">Định dạng</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['mp4', 'webm'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() =>
                        setExportSettings((s) => ({ ...s, format: fmt }))
                      }
                      className={`py-2.5 rounded-2xl text-xs font-bold uppercase transition border cursor-pointer ${
                        exportSettings.format === fmt
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] shadow-sm'
                          : 'bg-[var(--bg-card-inner)] border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-[var(--text-main)]">Tốc độ khung hình</span>
                <div className="grid grid-cols-2 gap-2">
                  {[60, 30].map((f) => (
                    <button
                      key={f}
                      onClick={() =>
                        setExportSettings((s) => ({ ...s, fps: f as 30 | 60 }))
                      }
                      className={`py-2.5 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                        exportSettings.fps === f
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] shadow-sm'
                          : 'bg-[var(--bg-card-inner)] border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Trigger Floating Pill Button */}
            <button
              onClick={handleStartExport}
              className="w-full py-4 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] font-extrabold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer mt-3"
            >
              <Sparkles size={18} />
              <span>Bắt đầu xuất video hoàn chỉnh (60 FPS)</span>
            </button>

            {/* Instant Raw Video Download */}
            {session.videoUrl && (
              <div className="pt-2.5 border-t border-[var(--border-inner)] flex items-center justify-between">
                <div className="text-xs text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--text-main)]">Video gốc (Raw):</span> Tải ngay 0 giây
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveVideo(session.videoBlob, session.videoUrl, `raw-recording-${Date.now()}.mp4`)}
                  className="px-4 py-2 rounded-full bg-[var(--bg-card-inner)] hover:bg-[var(--border-inner)] border border-[var(--border-inner)] text-[var(--text-main)] text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Lưu file video gốc ngay lập tức 0 giây"
                >
                  <Download size={14} />
                  <span>Tải video gốc (0s)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
