import React, { useRef } from 'react';
import { VideoStyleSettings, ZoomBlock, CursorStyleType, ClickEffectType, WindowFrameType } from '../types';
import { BACKGROUND_PRESETS } from '../engine/backgrounds';
import { 
  ZoomIn, 
  Layers, 
  Palette, 
  MousePointer, 
  Volume2, 
  Trash2, 
  Check, 
  Sparkles, 
  Sliders, 
  Crosshair, 
  Gauge,
  Upload
} from 'lucide-react';

interface ControlsSidebarProps {
  settings: VideoStyleSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoStyleSettings>>;
  selectedBlock: ZoomBlock | null;
  onUpdateZoomBlock: (updated: ZoomBlock) => void;
  onDeleteZoomBlock: (id: string) => void;
  activeTab: 'zoom' | 'frame' | 'bg' | 'cursor' | 'audio';
  setActiveTab: (tab: 'zoom' | 'frame' | 'bg' | 'cursor' | 'audio') => void;
}

export const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  settings,
  setSettings,
  selectedBlock,
  onUpdateZoomBlock,
  onDeleteZoomBlock,
  activeTab,
  setActiveTab,
}) => {
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSettings((s) => ({
          ...s,
          customBgImage: dataUrl,
          backgroundType: 'image',
        }));
      }
    };
    reader.readAsDataURL(file);
  };
  const cursorStyles: { id: CursorStyleType; label: string; desc: string; icon: React.ReactNode }[] = [
    { 
      id: 'macos', 
      label: 'macOS Arrow', 
      desc: 'Mũi tên Apple Sonoma',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M4 2 L4 20 L8.5 15.8 L11.8 23.2 L15.2 21.7 L11.8 14.5 L18.5 14.5 Z" fill="#000000" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      id: 'modern-dark', 
      label: 'Modern Dark', 
      desc: 'Obsidian viền Neon',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M4 3L11 21L14 14L21 11L4 3Z" fill="#090d16" stroke="#00E599" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'modern-light', 
      label: 'Modern Light', 
      desc: 'Trắng viền kim loại',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M4 3L11 21L14 14L21 11L4 3Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'circle-glow', 
      label: 'Glowing Dot', 
      desc: 'Tiêu điểm radar tròn',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="8" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="3.5" fill="#10b981" />
        </svg>
      )
    },
    { 
      id: 'crosshair', 
      label: 'Crosshair', 
      desc: 'Hồng tâm ngắm nét',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="6" stroke="#38bdf8" strokeWidth="1.5"/>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
  ];

  const clickEffects: { id: ClickEffectType; label: string; desc: string }[] = [
    { id: 'ripple', label: 'Gợn sóng (Ripple)', desc: 'Lan tỏa mềm' },
    { id: 'glow-pulse', label: 'Phát sáng (Glow)', desc: 'Chớp sáng điểm' },
    { id: 'sonar', label: 'Vòng Sonar', desc: 'Sóng radar 2 lớp' },
    { id: 'particle', label: 'Tia sáng (Particle)', desc: 'Tia hạt 360°' },
    { id: 'none', label: 'Không hiệu ứng', desc: 'Tắt hiệu ứng' },
  ];

  const windowFrames: { id: WindowFrameType; label: string }[] = [
    { id: 'none', label: 'Tràn viền' },
    { id: 'macos-dark', label: 'macOS Dark' },
    { id: 'macos-light', label: 'macOS Light' },
  ];

  const clickColors = ['#0D6832', '#38bdf8', '#818cf8', '#f43f5e', '#f59e0b', '#00E599'];

  return (
    <aside className="w-88 h-full floating-island p-4.5 flex flex-col select-none text-[var(--text-main)] ml-4 shrink-0 transition-all duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 mb-2.5 border-b border-[var(--border-inner)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center">
            <Sliders size={18} />
          </div>
          <span className="text-sm font-extrabold tracking-tight uppercase text-[var(--text-main)]">
            Bảng điều khiển (Inspector)
          </span>
        </div>
      </div>

      {/* Segmented Floating Tab Bar */}
      <div className="grid grid-cols-5 bg-[var(--bg-card-inner)] p-1 rounded-2xl border border-[var(--border-inner)] gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('zoom')}
          className={`py-2 flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'zoom'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <ZoomIn size={17} />
          <span>Zoom</span>
        </button>

        <button
          onClick={() => setActiveTab('frame')}
          className={`py-2 flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'frame'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <Layers size={17} />
          <span>Khung</span>
        </button>

        <button
          onClick={() => setActiveTab('bg')}
          className={`py-2 flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'bg'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <Palette size={17} />
          <span>Nền</span>
        </button>

        <button
          onClick={() => setActiveTab('cursor')}
          className={`py-2 flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'cursor'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <MousePointer size={17} />
          <span>Chuột</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`py-2 flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <Volume2 size={17} />
          <span>Tốc độ</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 pr-1 space-y-4">
        {/* 1. Zoom Tab */}
        {activeTab === 'zoom' && (
          <div className="space-y-4 animate-fade-in">
            {selectedBlock ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[var(--bg-card-highlight)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-bold text-[var(--accent-primary)]">{selectedBlock.label}</h3>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono font-bold mt-1">
                      {selectedBlock.startTime.toFixed(1)}s ➜ {selectedBlock.endTime.toFixed(1)}s ({(selectedBlock.endTime - selectedBlock.startTime).toFixed(1)}s)
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteZoomBlock(selectedBlock.id)}
                    className="p-2.5 rounded-2xl text-rose-500 hover:bg-rose-500/20 transition-all duration-150 active:scale-90 cursor-pointer"
                    title="Xóa khối zoom này"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Zoom Multiplier Slider */}
                <div className="space-y-2.5 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
                  <div className="flex items-center justify-between text-sm font-bold text-[var(--text-main)]">
                    <span className="flex items-center gap-2">
                      <ZoomIn size={16} className="text-[var(--accent-primary)]" />
                      <span>Độ phóng đại (Zoom)</span>
                    </span>
                    <span className="font-mono text-[var(--accent-primary)] font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] text-xs shadow-xs">
                      {selectedBlock.zoomLevel.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="3.5"
                    step="0.1"
                    value={selectedBlock.zoomLevel}
                    onChange={(e) =>
                      onUpdateZoomBlock({
                        ...selectedBlock,
                        zoomLevel: parseFloat(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer mt-1"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-dim)] font-bold">
                    <span>1.2x (Nhẹ)</span>
                    <span>2.2x (Chuẩn)</span>
                    <span>3.5x (Cận cảnh)</span>
                  </div>
                </div>

                {/* Focal Coordinates */}
                <div className="space-y-2.5 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
                  <div className="flex items-center justify-between text-sm font-bold text-[var(--text-main)]">
                    <span className="flex items-center gap-2">
                      <Crosshair size={16} className="text-[var(--accent-primary)]" />
                      <span>Tâm điểm phóng đại</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-inner)]">
                      <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]">
                        <span>Trục X</span>
                        <span className="font-mono font-extrabold text-[var(--accent-primary)]">{(selectedBlock.targetX * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.95"
                        step="0.01"
                        value={selectedBlock.targetX}
                        onChange={(e) =>
                          onUpdateZoomBlock({
                            ...selectedBlock,
                            targetX: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-2"
                      />
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-inner)]">
                      <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]">
                        <span>Trục Y</span>
                        <span className="font-mono font-extrabold text-[var(--accent-primary)]">{(selectedBlock.targetY * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.95"
                        step="0.01"
                        value={selectedBlock.targetY}
                        onChange={(e) =>
                          onUpdateZoomBlock({
                            ...selectedBlock,
                            targetY: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[var(--bg-card-inner)] rounded-3xl border border-dashed border-[var(--border-inner)] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] mx-auto flex items-center justify-center text-[var(--text-dim)]">
                  <ZoomIn size={24} />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">Chưa chọn khối Zoom nào</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                  Click vào một khối trên dòng thời gian hoặc bấm phím <kbd className="keycap">Z</kbd> để thêm đoạn Zoom mới.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. Frame Tab */}
        {activeTab === 'frame' && (
          <div className="space-y-4 animate-fade-in">
            {/* Window Frame Style */}
            <div className="space-y-2.5">
              <span className="text-sm font-extrabold text-[var(--text-main)]">Kiểu khung cửa sổ (Window Frame)</span>
              <div className="grid grid-cols-3 gap-2.5">
                {windowFrames.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSettings((s) => ({ ...s, windowFrame: f.id }))}
                    className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all duration-150 active:scale-95 cursor-pointer ${
                      settings.windowFrame === f.id
                        ? 'bg-[var(--bg-card-highlight)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--bg-card-inner)] border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Padding Slider */}
            <div className="space-y-2 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Khoảng đệm (Padding)</span>
                <span className="font-mono text-[var(--accent-primary)] font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] text-xs shadow-xs">
                  {settings.padding}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="4"
                value={settings.padding}
                onChange={(e) => setSettings((s) => ({ ...s, padding: parseInt(e.target.value) }))}
                className="w-full mt-1.5"
              />
            </div>

            {/* Corner Radius */}
            <div className="space-y-2 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Bo góc (Corner Radius)</span>
                <span className="font-mono text-[var(--accent-primary)] font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] text-xs shadow-xs">
                  {settings.borderRadius}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={settings.borderRadius}
                onChange={(e) => setSettings((s) => ({ ...s, borderRadius: parseInt(e.target.value) }))}
                className="w-full mt-1.5"
              />
            </div>
          </div>
        )}

        {/* 3. Background Tab */}
        {activeTab === 'bg' && (
          <div className="space-y-4 animate-fade-in">
            {/* Custom Background Image Uploader */}
            <div className="space-y-2.5 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[var(--text-main)]">Ảnh nền tùy chọn (Custom Image)</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium">Tải ảnh nền từ máy tính (PNG, JPG, WebP)</div>
                </div>
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgImageUpload}
                />
              </div>

              {settings.customBgImage ? (
                <div className="space-y-2.5 pt-1">
                  <div className="relative w-full h-28 rounded-2xl overflow-hidden border-2 border-[var(--accent-primary)] shadow-xs group">
                    <img 
                      src={settings.customBgImage} 
                      alt="Custom background" 
                      className="w-full h-full object-cover"
                      style={{ filter: settings.backgroundBlur ? `blur(${settings.backgroundBlur * 0.4}px)` : 'none' }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => bgFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-bold shadow-md hover:bg-zinc-100 transition cursor-pointer"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        onClick={() => setSettings((s) => ({ ...s, customBgImage: null, backgroundType: 'gradient' }))}
                        className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-500 transition cursor-pointer"
                      >
                        Gỡ ảnh
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSettings((s) => ({ ...s, customBgImage: null, backgroundType: 'gradient' }))}
                    className="w-full py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Dùng lại mẫu màu nền có sẵn</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full mt-2 py-4 rounded-2xl border-2 border-dashed border-[var(--border-inner)] hover:border-[var(--accent-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-highlight)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-card-inner)] flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div className="text-xs font-bold text-[var(--text-main)]">Tải ảnh nền lên từ máy tính</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-medium">Hỗ trợ ảnh chất lượng cao 4K / HD</div>
                </button>
              )}
            </div>

            {/* Background Blur Slider */}
            <div className="space-y-2.5 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div className="flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-[var(--accent-primary)]" />
                  <span>Làm mờ nền (Background Blur)</span>
                </div>
                <span className="font-mono text-[var(--accent-primary)] font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] text-xs shadow-xs">
                  {settings.backgroundBlur || 0}px
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">Tạo độ mờ chiều sâu cinematic cho ảnh hoặc màu nền</p>

              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={settings.backgroundBlur || 0}
                onChange={(e) => setSettings((s) => ({ ...s, backgroundBlur: parseInt(e.target.value) }))}
                className="w-full mt-1.5"
              />

              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: 'Tắt (0px)', val: 0 },
                  { label: 'Nhẹ (8px)', val: 8 },
                  { label: 'Vừa (18px)', val: 18 },
                  { label: 'Sâu (32px)', val: 32 },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => setSettings((s) => ({ ...s, backgroundBlur: b.val }))}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      (settings.backgroundBlur || 0) === b.val
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-inner)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Palette Collection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[var(--text-main)]">Mẫu màu Studio (Presets)</span>
                {!settings.customBgImage && (
                  <span className="text-xs font-bold text-[var(--accent-primary)] font-mono">
                    {BACKGROUND_PRESETS.find(p => p.id === settings.backgroundId)?.name || 'Custom'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-0.5">
                {BACKGROUND_PRESETS.map((p) => {
                  const isSelected = !settings.customBgImage && settings.backgroundId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSettings((s) => ({ ...s, backgroundId: p.id, customBgImage: null, backgroundType: 'gradient' }))}
                      className={`h-20 rounded-2xl p-2.5 flex flex-col justify-between text-left relative overflow-hidden transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[var(--accent-primary)] shadow-sm'
                          : 'border border-[var(--border-inner)] hover:border-[var(--text-muted)] opacity-85 hover:opacity-100'
                      }`}
                      style={{ background: p.cssBackground }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md shadow-xs">
                          {p.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-text)] flex items-center justify-center shadow-md">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. Cursor Tab */}
        {activeTab === 'cursor' && (
          <div className="space-y-4 animate-fade-in">
            {/* Show Cursor Switch */}
            <div className="flex items-center justify-between bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div>
                <span className="text-sm font-bold text-[var(--text-main)]">Con trỏ chuột mượt</span>
                <p className="text-xs text-[var(--text-muted)] font-medium">Nội suy quỹ đạo di chuyển mượt mà 60fps</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showCursor}
                onChange={(e) => setSettings((s) => ({ ...s, showCursor: e.target.checked }))}
                className="w-5 h-5 accent-[var(--accent-primary)] rounded cursor-pointer"
              />
            </div>

            {/* Cursor Styles */}
            <div className="space-y-2.5">
              <span className="text-sm font-extrabold text-[var(--text-main)]">Kiểu con trỏ (Cursor Styles)</span>
              <div className="flex flex-col gap-2">
                {cursorStyles.map((c) => {
                  const isSelected = settings.cursorStyle === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSettings((s) => ({ ...s, cursorStyle: c.id }))}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-card-highlight)] border-2 border-[var(--accent-primary)] text-[var(--text-main)] shadow-xs'
                          : 'bg-[var(--bg-card-inner)] border border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-inner)] flex items-center justify-center shrink-0">
                          {c.icon}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-[var(--text-main)]">{c.label}</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-medium">{c.desc}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-text)] flex items-center justify-center shrink-0">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Click Effect */}
            <div className="space-y-2.5">
              <span className="text-sm font-extrabold text-[var(--text-main)]">Hiệu ứng khi Click</span>
              <div className="grid grid-cols-2 gap-2">
                {clickEffects.map((e) => {
                  const isSelected = settings.clickEffect === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSettings((s) => ({ ...s, clickEffect: e.id }))}
                      className={`py-2 px-3 rounded-2xl text-left border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-card-highlight)] border-2 border-[var(--accent-primary)] text-[var(--text-main)]'
                          : 'bg-[var(--bg-card-inner)] border border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[var(--text-main)] truncate">{e.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-medium truncate">{e.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Click Color Chips */}
            <div className="space-y-2.5 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <span className="text-sm font-bold text-[var(--text-main)]">Màu hiệu ứng Click</span>
              <div className="flex items-center gap-2.5 pt-1">
                {clickColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSettings((s) => ({ ...s, clickColor: color }))}
                    className={`w-8 h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
                      settings.clickColor === color 
                        ? 'border-2 border-[var(--accent-primary)] bg-[var(--bg-card)] shadow-xs' 
                        : 'border border-transparent hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Strokes Overlay Settings */}
            <div className="space-y-3.5 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[var(--text-main)]">Hiển thị phím bấm (Keystrokes)</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium">Nổi tổ hợp phím (Ctrl+C, Enter...)</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showKeyStrokes}
                  onChange={(e) => setSettings((s) => ({ ...s, showKeyStrokes: e.target.checked }))}
                  className="w-5 h-5 accent-[var(--accent-primary)] rounded cursor-pointer"
                />
              </div>

              {settings.showKeyStrokes && (
                <div className="space-y-2.5 pt-2 border-t border-[var(--border-inner)]">
                  <div className="text-xs font-bold text-[var(--text-muted)]">Vị trí:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bottom-left', label: 'Trái' },
                      { id: 'bottom-center', label: 'Giữa' },
                      { id: 'bottom-right', label: 'Phải' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setSettings((s) => ({ ...s, keyStrokePosition: pos.id as any }))}
                        className={`py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                          settings.keyStrokePosition === pos.id
                            ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] shadow-xs'
                            : 'bg-[var(--bg-card)] border-[var(--border-inner)] text-[var(--text-muted)]'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Audio & Speed Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-3 bg-[var(--bg-card-inner)] p-4 rounded-3xl border border-[var(--border-inner)] shadow-xs">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="flex items-center gap-2">
                  <Gauge size={18} className="text-[var(--accent-primary)]" />
                  <span>Tốc độ phát (Speed)</span>
                </span>
                <span className="font-mono text-[var(--accent-primary)] font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-inner)] text-xs shadow-xs">
                  {settings.playbackSpeed}x
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[0.8, 1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSettings((s) => ({ ...s, playbackSpeed: spd }))}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                      settings.playbackSpeed === spd
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
