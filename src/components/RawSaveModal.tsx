import React, { useState, useEffect, useCallback } from 'react';
import { Folder, HardDrive, Check, X, Download, ExternalLink, RefreshCw, FolderPlus } from 'lucide-react';
import { RecordingSession } from '../types';

interface RawSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: RecordingSession;
}

export const RawSaveModal: React.FC<RawSaveModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [defaultFolder, setDefaultFolder] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  useEffect(() => {
    const saved = localStorage.getItem('lyang_raw_save_folder');
    if (saved) {
      setDefaultFolder(saved);
    }
  }, []);

  const handleAnimatedClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 190);
  }, [onClose]);

  const handlePickFolder = async () => {
    if (!hasTauri) {
      alert('Tính năng chọn thư mục cục bộ khả dụng trên ứng dụng LyangRecorder Native.');
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const folder: string | null = await invoke('pick_folder_dialog');
      if (folder) {
        setDefaultFolder(folder);
        localStorage.setItem('lyang_raw_save_folder', folder);
      }
    } catch (err: any) {
      console.error('Pick folder error:', err);
    }
  };

  const handleClearDefaultFolder = () => {
    setDefaultFolder('');
    localStorage.removeItem('lyang_raw_save_folder');
  };

  const handleSaveRaw = async () => {
    if (!session.videoUrl && !session.videoBlob) {
      setErrorMessage('Không tìm thấy video nào để tải. Hãy quay hoặc nhập video trước!');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSavedFilePath(null);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const defaultFilename = `LyangRecorder_Raw_${timestamp}.mp4`;

    try {
      let arrayBuffer: ArrayBuffer;
      if (session.videoBlob) {
        arrayBuffer = await session.videoBlob.arrayBuffer();
      } else if (session.videoUrl) {
        const resp = await fetch(session.videoUrl);
        arrayBuffer = await resp.arrayBuffer();
      } else {
        throw new Error('No video data found');
      }

      const bytes = Array.from(new Uint8Array(arrayBuffer));

      if (hasTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        const path: string | null = await invoke('save_raw_video_to_disk', {
          bytes,
          targetFolder: defaultFolder.trim() || null,
          defaultName: defaultFilename,
        });

        if (path) {
          setSavedFilePath(path);
        }
      } else {
        // Fallback browser anchor download
        const blob = session.videoBlob || new Blob([arrayBuffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSavedFilePath(defaultFilename);
      }
    } catch (err: any) {
      console.error('Save raw error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu file video');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFolder = async (filePath: string) => {
    if (!hasTauri) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_file_in_folder', { filePath });
    } catch (e) {
      console.error('Open folder error:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAnimatedClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-lg p-4 select-none ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      <div 
        className={`w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-card)] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isClosing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--border-inner)] bg-[var(--bg-card)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center shadow-xs">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">Tải bản video gốc (Raw)</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">Lưu trực tiếp video gốc chưa qua xử lý khung hình</p>
            </div>
          </div>
          <button
            onClick={handleAnimatedClose}
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-inner)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Default Folder Setting Card */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-inner)] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--text-main)]">
                <Folder size={16} className="text-[var(--accent-primary)]" />
                <span>Thư mục lưu mặc định</span>
              </div>
              {defaultFolder && (
                <button
                  onClick={handleClearDefaultFolder}
                  className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Xóa mặc định
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-inner)] text-xs text-[var(--text-main)] font-mono truncate">
                {defaultFolder ? defaultFolder : (
                  <span className="text-[var(--text-muted)] font-sans italic">Chưa thiết lập (Sẽ hỏi vị trí lưu mỗi lần)</span>
                )}
              </div>
              <button
                onClick={handlePickFolder}
                className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <FolderPlus size={14} />
                <span>{defaultFolder ? 'Đổi thư mục' : 'Chọn thư mục'}</span>
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
              💡 {defaultFolder 
                ? 'Video sẽ được tự động lưu ngay vào thư mục này khi bạn bấm tải mà không cần chọn lại.' 
                : 'Đặt thư mục mặc định giúp bạn tải nhanh video chỉ bằng 1 cú nhấp chuột.'}
            </p>
          </div>

          {/* Success Notification */}
          {savedFilePath && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <Check size={16} className="text-emerald-500" />
                <span>Đã lưu video Raw thành công!</span>
              </div>
              <div className="text-[11px] font-mono break-all bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                {savedFilePath}
              </div>
              {hasTauri && (
                <button
                  onClick={() => handleOpenFolder(savedFilePath)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink size={13} />
                  <span>Hiển thị trong File Explorer</span>
                </button>
              )}
            </div>
          )}

          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-inner)] bg-[var(--bg-card)] flex items-center justify-between shrink-0">
          <button
            onClick={handleAnimatedClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            onClick={handleSaveRaw}
            disabled={isSaving || !session.videoUrl}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-extrabold transition-all duration-200 shadow-md ${
              isSaving || !session.videoUrl
                ? 'opacity-50 cursor-not-allowed bg-zinc-300 dark:bg-zinc-800 text-zinc-500'
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] hover:shadow-emerald-500/25 active:scale-95 cursor-pointer'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Đang lưu video...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Tải bản Raw ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
