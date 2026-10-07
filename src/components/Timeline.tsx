import React, { useRef, useState } from 'react';
import { RecordingSession, ZoomBlock } from '../types';
import { 
  Play, 
  Pause, 
  Plus, 
  Sparkles, 
  ZoomIn, 
  MousePointer, 
  Keyboard, 
  Layers,
  Trash2
} from 'lucide-react';

interface TimelineProps {
  session: RecordingSession;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onAddZoomBlock: () => void;
  onDeleteZoomBlock?: (id: string) => void;
  onSelectZoomBlock: (id: string | null) => void;
  onUpdateZoomBlock: (updated: ZoomBlock) => void;
  onAutoDetectZoom: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const Timeline: React.FC<TimelineProps> = ({
  session,
  onSeek,
  onTogglePlay,
  onAddZoomBlock,
  onDeleteZoomBlock,
  onSelectZoomBlock,
  onUpdateZoomBlock,
  onAutoDetectZoom,
  videoRef,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timeCodeRef = useRef<HTMLSpanElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<{
    blockId: string;
    type: 'start' | 'end' | 'move';
    initialX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const rawDuration = session.duration;
  const safeDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 10;
  const duration = Math.max(1, Math.min(3600, safeDuration));
  const safeCurrentTime = Number.isFinite(session.currentTime) ? session.currentTime : 0;
  const playheadPercent = Math.max(0, Math.min(100, (safeCurrentTime / duration) * 100));

  // Handle Scrubbing
  const handleMouseDownTrack = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    setIsScrubbing(true);
    updateSeek(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      updateSeek(e);
    } else if (draggingHandle && trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const deltaSec = ((e.clientX - draggingHandle.initialX) / rect.width) * duration;
      const block = session.zoomBlocks.find((b) => b.id === draggingHandle.blockId);
      if (!block) return;

      if (draggingHandle.type === 'start') {
        const newStart = Math.max(0, Math.min(block.endTime - 0.4, draggingHandle.initialStart + deltaSec));
        onUpdateZoomBlock({ ...block, startTime: Number(newStart.toFixed(2)) });
      } else if (draggingHandle.type === 'end') {
        const newEnd = Math.min(duration, Math.max(block.startTime + 0.4, draggingHandle.initialEnd + deltaSec));
        onUpdateZoomBlock({ ...block, endTime: Number(newEnd.toFixed(2)) });
      } else if (draggingHandle.type === 'move') {
        const blockDuration = draggingHandle.initialEnd - draggingHandle.initialStart;
        let newStart = draggingHandle.initialStart + deltaSec;
        let newEnd = newStart + blockDuration;

        if (newStart < 0) {
          newStart = 0;
          newEnd = blockDuration;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - blockDuration;
        }
        onUpdateZoomBlock({
          ...block,
          startTime: Number(newStart.toFixed(2)),
          endTime: Number(newEnd.toFixed(2)),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsScrubbing(false);
    setDraggingHandle(null);
  };

  const updateSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * duration);
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60);
    const remainingSecs = (s % 60).toFixed(1);
    return `${m.toString().padStart(2, '0')}:${remainingSecs.padStart(4, '0')}`;
  };

  // Real-time zero-overhead playhead animation during video playback
  React.useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    let animId: number;
    const updatePlayhead = () => {
      if (video && !video.paused) {
        const cur = video.currentTime;
        const pct = Math.max(0, Math.min(100, (cur / duration) * 100));
        if (playheadRef.current) {
          playheadRef.current.style.left = `${pct}%`;
        }
        if (timeCodeRef.current) {
          timeCodeRef.current.textContent = formatTime(cur);
        }
      }
      if (session.isPlaying) {
        animId = requestAnimationFrame(updatePlayhead);
      }
    };

    if (session.isPlaying) {
      animId = requestAnimationFrame(updatePlayhead);
    } else {
      // Sync once when paused or sought
      if (playheadRef.current) {
        playheadRef.current.style.left = `${playheadPercent}%`;
      }
      if (timeCodeRef.current) {
        timeCodeRef.current.textContent = formatTime(safeCurrentTime);
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [session.isPlaying, duration, playheadPercent, safeCurrentTime, videoRef]);

  const timeMarkersCount = Math.max(4, Math.min(12, Math.ceil(duration)));
  const timeMarkers = Array.from({ length: timeMarkersCount + 1 }, (_, i) => {
    const t = (i / timeMarkersCount) * duration;
    return { time: t, pct: (i / timeMarkersCount) * 100 };
  });

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full pt-3 flex flex-col gap-2.5 select-none shrink-0"
    >
      {/* Timeline Header Bar */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlay}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] shadow-md transition-all duration-150 active:scale-90 cursor-pointer"
            >
              {session.isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
            </button>

            {/* Time Code Badge */}
            <div className="flex items-baseline gap-1.5 font-mono text-sm px-3.5 py-1 rounded-full bg-[var(--bg-card-inner)] border border-[var(--border-inner)] shadow-xs">
              <span ref={timeCodeRef} className="font-extrabold text-[var(--text-main)]">{formatTime(safeCurrentTime)}</span>
              <span className="text-[var(--text-dim)]">/</span>
              <span className="text-[var(--text-muted)] font-bold">{formatTime(duration)}</span>
            </div>

            <div className="w-[1.5px] h-5 bg-[var(--border-inner)]" />

            {/* Zoom Blocks Summary */}
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
              <Layers size={16} className="text-[var(--accent-primary)]" />
              <span>{session.zoomBlocks.length} Khối Smart Zoom</span>
            </div>
          </div>

          {/* Quick Action Floating Buttons */}
          <div className="flex items-center gap-2.5">
            {session.selectedBlockId && onDeleteZoomBlock && (
              <button
                onClick={() => onDeleteZoomBlock(session.selectedBlockId!)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-500 hover:bg-rose-500/15 border border-rose-500/30 transition shadow-xs active:scale-95 cursor-pointer"
                title="Xóa khối zoom đang chọn (Del)"
              >
                <Trash2 size={14} />
                <span>Xóa khối (Del)</span>
              </button>
            )}

            <button
              onClick={onAddZoomBlock}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-[var(--accent-light)] hover:opacity-90 text-[var(--accent-primary)] border border-[var(--border-inner)] transition shadow-xs active:scale-95 cursor-pointer"
              title="Thêm khối zoom tại vị trí hiện tại (Phím Z)"
            >
              <Plus size={15} />
              <span>Thêm Zoom (Z)</span>
            </button>

            <button
              onClick={onAutoDetectZoom}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition shadow-xs active:scale-95 cursor-pointer"
              title="Tự động tạo zoom theo lượt click"
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>Quét Click Auto-Zoom</span>
            </button>
          </div>
        </div>

        {/* Multi-Track Workspace */}
        <div className="flex gap-3.5 items-stretch">
          {/* Left Track Labels */}
          <div className="w-32 flex flex-col justify-around py-1 text-xs font-extrabold text-[var(--text-muted)] shrink-0">
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
              <ZoomIn size={16} />
              <span>Smart Zoom</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <MousePointer size={16} />
              <span>Lượt Click</span>
            </div>
            {session.keyEvents && session.keyEvents.length > 0 && (
              <div className="flex items-center gap-2 text-emerald-500">
                <Keyboard size={16} />
                <span>Phím gõ</span>
              </div>
            )}
          </div>

          {/* Timeline Tracks Area */}
          <div
            ref={trackRef}
            onMouseDown={handleMouseDownTrack}
            className="flex-1 h-24 bg-[var(--bg-card-inner)] rounded-2xl border border-[var(--border-inner)] relative overflow-hidden cursor-pointer shadow-inner"
          >
            {/* Time Grid Lines */}
            {timeMarkers.map((m, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 border-l border-[var(--border-inner)] pointer-events-none"
                style={{ left: `${m.pct}%` }}
              >
                <span className="text-[10px] font-mono font-bold text-[var(--text-dim)] pl-1.5 select-none">
                  {m.time.toFixed(0)}s
                </span>
              </div>
            ))}

            {/* Track 1: Zoom Blocks */}
            <div className="absolute top-3.5 left-0 right-0 h-7 pointer-events-none">
              {session.zoomBlocks.map((block) => {
                const leftPct = Math.max(0, (block.startTime / duration) * 100);
                const widthPct = Math.max(2, ((block.endTime - block.startTime) / duration) * 100);
                const isSelected = block.id === session.selectedBlockId;

                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectZoomBlock(block.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectZoomBlock(block.id);
                      setDraggingHandle({
                        blockId: block.id,
                        type: 'move',
                        initialX: e.clientX,
                        initialStart: block.startTime,
                        initialEnd: block.endTime,
                      });
                    }}
                    className={`absolute top-0 bottom-0 rounded-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-between px-2.5 text-xs font-bold shadow-md transition-all duration-150 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0D6832] via-[#00E599] to-[#10B981] text-zinc-950 border-2 border-white'
                        : 'bg-gradient-to-r from-[#1A4D2E] to-[#2D6A4F] text-white opacity-95 hover:opacity-100 hover:shadow-lg'
                    }`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  >
                    {/* Left Trim Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingHandle({
                          blockId: block.id,
                          type: 'start',
                          initialX: e.clientX,
                          initialStart: block.startTime,
                          initialEnd: block.endTime,
                        });
                      }}
                      className="w-3 h-full -ml-2.5 cursor-ew-resize hover:bg-amber-400 rounded-l-xl transition-colors"
                      title="Kéo để chỉnh thời điểm bắt đầu Zoom"
                    />

                    <span className="truncate font-sans font-extrabold">{block.label} ({block.zoomLevel}x)</span>

                    {/* Right Trim Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingHandle({
                          blockId: block.id,
                          type: 'end',
                          initialX: e.clientX,
                          initialStart: block.startTime,
                          initialEnd: block.endTime,
                        });
                      }}
                      className="w-3 h-full -mr-2.5 cursor-ew-resize hover:bg-amber-400 rounded-r-xl transition-colors"
                      title="Kéo để chỉnh thời điểm kết thúc Zoom"
                    />
                  </div>
                );
              })}
            </div>

            {/* Track 2: Click Dots */}
            <div className="absolute bottom-6 left-0 right-0 h-3 pointer-events-none">
              {session.clicks.map((c) => {
                const clickSec = c.t / 1000;
                const pct = (clickSec / duration) * 100;
                return (
                  <div
                    key={c.id}
                    className="absolute top-0 w-3 h-3 -ml-1.5 rounded-full bg-amber-500 border-2 border-white shadow-md hover:scale-150 transition-transform"
                    style={{ left: `${pct}%` }}
                    title={`Click tại ${clickSec.toFixed(2)}s`}
                  />
                );
              })}
            </div>

            {/* Track 3: Key Event Dots */}
            {session.keyEvents && (
              <div className="absolute bottom-2 left-0 right-0 h-3 pointer-events-none">
                {session.keyEvents.map((k) => {
                  const keySec = k.t / 1000;
                  const pct = (keySec / duration) * 100;
                  return (
                    <div
                      key={k.id}
                      className="absolute top-0 w-3 h-3 -ml-1.5 rounded-sm bg-emerald-500 border-2 border-white shadow-md hover:scale-150 transition-transform"
                      style={{ left: `${pct}%` }}
                      title={`Phím: ${k.key} (${keySec.toFixed(2)}s)`}
                    />
                  );
                })}
              </div>
            )}

            {/* Playhead Scrubber */}
            <div
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-primary)] z-20 pointer-events-none will-change-[left]"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="w-3.5 h-3.5 -ml-[7px] -mt-0.5 bg-[var(--accent-primary)] border-2 border-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  };
