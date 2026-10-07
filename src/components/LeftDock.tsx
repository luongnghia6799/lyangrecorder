import React from 'react';
import { 
  Video, 
  Layers, 
  Sparkles, 
  Palette, 
  MousePointer, 
  Keyboard, 
  HelpCircle,
  Clapperboard,
  Volume2,
  VolumeX,
  Moon,
  Sun
} from 'lucide-react';

interface LeftDockProps {
  activeTab: string;
  onTabChange: (tab: 'zoom' | 'frame' | 'bg' | 'cursor' | 'audio' | 'studio') => void;
  onOpenRecorder: () => void;
  onOpenShortcuts: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: 'warm' | 'dark';
  onToggleTheme: () => void;
}

export const LeftDock: React.FC<LeftDockProps> = ({
  activeTab,
  onTabChange,
  onOpenRecorder,
  onOpenShortcuts,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
}) => {
  return (
    <aside className="w-16 h-full flex flex-col items-center justify-between py-3 select-none z-20 shrink-0 pl-3 transition-colors">
      {/* Top Section: App Logo & Navigation Tools */}
      <div className="flex flex-col items-center gap-3.5 w-full">
        {/* Captist Studio Logo Button */}
        <button 
          onClick={() => onTabChange('studio')}
          className="w-11 h-11 rounded-2xl bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-md cursor-pointer transition transform hover:scale-105 active:scale-95"
          title="Captist Studio - Về màn hình chính"
        >
          <Clapperboard size={20} className="text-white" />
        </button>

        {/* Navigation Item Capsules */}
        <nav className="flex flex-col items-center gap-2 w-full">
          {/* 1. Studio Editor */}
          <button 
            onClick={() => onTabChange('studio')}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs active:scale-95 ${
              activeTab === 'studio'
                ? 'bg-[var(--accent-primary)] text-white shadow-emerald-900/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
            title="Trình chỉnh sửa Studio"
          >
            <Video size={18} />
          </button>

          {/* 2. Smart Zoom Blocks */}
          <button 
            onClick={() => onTabChange('zoom')}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs active:scale-95 ${
              activeTab === 'zoom'
                ? 'bg-[var(--accent-primary)] text-white shadow-emerald-900/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
            title="Chỉnh sửa Smart Zoom"
          >
            <Sparkles size={18} />
          </button>

          {/* 3. Window Frames & Shadows */}
          <button 
            onClick={() => onTabChange('frame')}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs active:scale-95 ${
              activeTab === 'frame'
                ? 'bg-[var(--accent-primary)] text-white shadow-emerald-900/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
            title="Khung cửa sổ & Đổ bóng"
          >
            <Layers size={18} />
          </button>

          {/* 4. Canvas Backgrounds */}
          <button 
            onClick={() => onTabChange('bg')}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs active:scale-95 ${
              activeTab === 'bg'
                ? 'bg-[var(--accent-primary)] text-white shadow-emerald-900/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
            title="Hình nền Canvas"
          >
            <Palette size={18} />
          </button>

          {/* 5. Cursor & Click Ripples */}
          <button 
            onClick={() => onTabChange('cursor')}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs active:scale-95 ${
              activeTab === 'cursor'
                ? 'bg-[var(--accent-primary)] text-white shadow-emerald-900/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
            title="Con trỏ & Hiệu ứng Click"
          >
            <MousePointer size={18} />
          </button>

          {/* 6. Keyboard Shortcuts */}
          <button 
            onClick={onOpenShortcuts}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition active:scale-95"
            title="Phím tắt nhanh (Space, Z, F9...)"
          >
            <Keyboard size={18} />
          </button>
        </nav>
      </div>

      {/* Bottom Section: Floating Control Capsule */}
      <div className="w-10 bg-[#0F2416] dark:bg-[#12161C] rounded-3xl py-3 px-1 flex flex-col items-center gap-3 shadow-lg border border-[#1E3B26] dark:border-[#232B36]">
        {/* 1. Quick Record Button */}
        <button 
          onClick={onOpenRecorder}
          className="w-7 h-7 rounded-full bg-emerald-700/80 hover:bg-emerald-600 flex items-center justify-center text-white transition shadow-sm active:scale-90"
          title="Bắt đầu quay màn hình (F9)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        </button>

        {/* 2. Audio Toggle */}
        <button 
          onClick={onToggleMute}
          className={`transition active:scale-90 ${isMuted ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400/80 hover:text-white'}`}
          title={isMuted ? 'Bật âm thanh video' : 'Tắt tiếng video (Mute)'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* 3. Dark/Light/Warm Theme Toggle */}
        <button 
          onClick={onToggleTheme}
          className="text-emerald-400/80 hover:text-white transition active:scale-90"
          title={theme === 'dark' ? 'Chuyển sang giao diện Warm Cream' : 'Chuyển sang giao diện Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
        </button>

        {/* 4. Shortcuts / Help */}
        <button 
          onClick={onOpenShortcuts}
          className="text-emerald-400/60 hover:text-white transition active:scale-90"
          title="Hướng dẫn phím tắt & trợ giúp"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </aside>
  );
};
