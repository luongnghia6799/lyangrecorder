import React, { useState, useEffect } from 'react';
import { AspectRatioType } from '../types';
import appLogo from '../assets/logo.png';
import { 
  Sparkles, 
  Download, 
  Upload, 
  Tv, 
  Smartphone, 
  Square, 
  PlaySquare,
  Zap,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Keyboard,
  Sliders
} from 'lucide-react';

interface HeaderProps {
  aspectRatio: AspectRatioType;
  setAspectRatio: (ar: AspectRatioType) => void;
  onOpenRecorder: () => void;
  onOpenExport: () => void;
  onImportVideo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoDetectZoom: () => void;
  theme: 'warm' | 'dark';
  onToggleTheme: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenShortcuts: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  aspectRatio,
  setAspectRatio,
  onOpenRecorder,
  onOpenExport,
  onImportVideo,
  onAutoDetectZoom,
  theme,
  onToggleTheme,
  isMuted,
  onToggleMute,
  onOpenShortcuts,
  isInspectorOpen,
  onToggleInspector,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hrs}:${mins}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const aspectRatios: { id: AspectRatioType; label: string; icon: React.ReactNode }[] = [
    { id: '16:9', label: '16:9', icon: <Tv size={15} /> },
    { id: '9:16', label: '9:16', icon: <Smartphone size={15} /> },
    { id: '1:1', label: '1:1', icon: <Square size={15} /> },
    { id: '4:3', label: '4:3', icon: <PlaySquare size={15} /> },
  ];

  return (
    <header className="w-full bg-[var(--bg-app)] px-5 pt-3 pb-1.5 flex items-center justify-between gap-2 xl:gap-3 select-none shrink-0 z-30 transition-all duration-200">
      {/* 1. Left Brand & Studio Badge */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img src={appLogo} alt="LyangRecorder" className="w-full h-full object-contain" />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-extrabold tracking-tight text-[var(--text-main)] font-sans truncate">
            LyangRecorder
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)] text-[10px] font-extrabold border border-[var(--border-inner)] shrink-0">
            <Zap size={10} className="fill-[var(--accent-primary)]" />
            <span>PRO</span>
          </span>
          {timeStr && (
            <span className="hidden md:inline text-[11px] font-mono font-bold text-[var(--text-muted)] pl-1.5 border-l border-[var(--border-inner)] shrink-0">
              {timeStr}
            </span>
          )}
        </div>
      </div>

        {/* 2. Center Aspect Ratio Selector */}
        <div className="flex items-center bg-[var(--bg-card-inner)] border border-[var(--border-inner)] p-1 rounded-full gap-1 shrink-0">
          {aspectRatios.map((ar) => {
            const isActive = aspectRatio === ar.id;
            return (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
                title={`Khung hình ${ar.label}`}
              >
                {ar.icon}
                <span className="font-mono text-xs">{ar.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Right Action Tools (Icon-only with elegant hover tooltips) */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0 min-w-0">
          {/* Hidden File Input for video import */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onImportVideo}
          />

          {/* Import Video Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card-inner)] hover:bg-[var(--border-inner)] border border-[var(--border-inner)] text-[var(--text-main)] shadow-xs transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
              aria-label="Nhập Video"
            >
              <Upload size={16} />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>Nhập Video</span>
            </div>
          </div>

          {/* Smart Auto-Zoom Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onAutoDetectZoom}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
              aria-label="Tự động tạo Zoom"
            >
              <Sparkles size={16} className="text-amber-500" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>Auto-Zoom (Tự tạo zoom)</span>
            </div>
          </div>

          {/* Record Button (Floating Red Circle) */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onOpenRecorder}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:shadow-rose-600/30 transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
              aria-label="Quay màn hình"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>Quay màn hình</span>
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-mono font-bold">F9</kbd>
            </div>
          </div>

          {/* Export 4K Button (Emerald Circle) */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onOpenExport}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] shadow-md hover:shadow-emerald-500/25 transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
              aria-label="Xuất video"
            >
              <Download size={16} />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>Xuất video 4K 60fps</span>
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-mono font-bold">Ctrl+E</kbd>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1px] h-5 bg-[var(--border-inner)] mx-0.5" />

          {/* Inspector Panel Toggle Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onToggleInspector}
              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-150 active:scale-90 cursor-pointer shrink-0 ${
                isInspectorOpen
                  ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-xs'
                  : 'bg-[var(--bg-card-inner)] border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              aria-label="Bảng điều khiển"
            >
              <Sliders size={16} />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>{isInspectorOpen ? 'Ẩn cài đặt' : 'Mở cài đặt'}</span>
            </div>
          </div>

          {/* Audio Mute Toggle */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onToggleMute}
              className={`w-9 h-9 flex items-center justify-center rounded-full border shadow-xs transition-all duration-150 active:scale-90 cursor-pointer shrink-0 ${
                isMuted 
                  ? 'text-rose-500 border-rose-500/40 bg-rose-500/15' 
                  : 'bg-[var(--bg-card-inner)] border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              aria-label="Âm thanh"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>{isMuted ? 'Bật tiếng' : 'Tắt tiếng'}</span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card-inner)] border border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-xs transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
              aria-label="Đổi giao diện"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>{theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
            </div>
          </div>

          {/* Shortcuts Guide Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onOpenShortcuts}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card-inner)] border border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-xs transition-all duration-150 active:scale-90 cursor-pointer shrink-0"
              aria-label="Phím tắt"
            >
              <Keyboard size={16} />
            </button>
            <div className="absolute top-full mt-2 right-0 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
              <span>Bảng phím tắt</span>
            </div>
          </div>
        </div>
      </header>
    );
  };
