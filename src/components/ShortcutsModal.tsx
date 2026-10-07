import React, { useState, useCallback } from 'react';
import { X, Keyboard, Sparkles, Video, Play, Maximize2, Minimize2 } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
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

  const categories = [
    {
      title: 'Quay & Ghi hình Studio',
      icon: <Video size={18} className="text-rose-500" />,
      items: [
        { key: 'F9', desc: 'Phím tắt toàn cục để DỪNG QUAY màn hình tức thì' },
        { key: 'Escape', desc: 'Dừng quay màn hình / Đóng bảng điều khiển' },
        { key: 'F11', desc: 'Bật / Tắt chế độ Toàn màn hình (Fullscreen)' },
      ],
    },
    {
      title: 'Phát & Điều hướng',
      icon: <Play size={18} className="text-emerald-500" />,
      items: [
        { key: 'Space', desc: 'Phát hoặc Tạm dừng phát video (Play / Pause)' },
        { key: '← / →', desc: 'Tua tới / Tua lùi 0.5 giây trên dòng thời gian' },
        { key: 'Shift + ← / →', desc: 'Tua nhanh 2.0 giây trên dòng thời gian' },
      ],
    },
    {
      title: 'Smart Auto-Zoom & Chỉnh sửa',
      icon: <Sparkles size={18} className="text-amber-500" />,
      items: [
        { key: 'Z', desc: 'Thêm một khối Smart Zoom tại vị trí hiện tại' },
        { key: 'Ctrl + / -', desc: 'Tăng / Giảm độ phóng đại Zoom (+0.2x / -0.2x)' },
        { key: 'Ctrl + 0', desc: 'Đặt lại mức phóng đại Zoom về chuẩn' },
        { key: 'Del / Backspace', desc: 'Xóa khối Smart Zoom đang được chọn' },
        { key: 'Click & Kéo', desc: 'Kéo thả trực tiếp trên Canvas để đặt tâm Zoom' },
      ],
    },
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAnimatedClose();
      }}
      className={`fixed inset-0 z-50 bg-black/65 backdrop-blur-lg flex items-center justify-center p-4 select-none ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      <div 
        className={`w-full ${
          isExpanded ? 'max-w-4xl w-[92vw]' : 'max-w-lg'
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
            className="p-2 rounded-full text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-inner)] transition cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 mb-6 pr-20">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center shadow-xs shrink-0">
            <Keyboard size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Phím Tắt Nhanh (Keyboard Shortcuts)</h2>
            <p className="text-xs text-[var(--text-muted)] font-medium">Tăng tốc độ thao tác quay & biên tập video trong Studio</p>
          </div>
        </div>

        <div className={`space-y-5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar ${isExpanded ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
          {categories.map((cat, idx) => (
            <div key={idx} className={`space-y-2.5 ${isExpanded && idx === 2 ? 'col-span-2' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                {cat.icon}
                <span>{cat.title}</span>
              </div>

              <div className="space-y-2">
                {cat.items.map((s, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-inner)] transition-all hover:bg-[var(--bg-card)] shadow-xs"
                  >
                    <span className="text-xs text-[var(--text-muted)] font-bold pr-2">{s.desc}</span>
                    <kbd className="keycap shrink-0 text-xs font-mono">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAnimatedClose}
          className="w-full mt-6 py-3.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] font-extrabold text-sm shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};
