import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MousePoint, ClickEvent, RecordingSession } from '../types';
import { generateAutoZoomBlocks } from '../engine/autoZoom';
import { 
  Monitor, 
  AppWindow, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MousePointer, 
  Keyboard,
  Sparkles, 
  X, 
  RefreshCw, 
  Play,
  Layers,
  Cpu,
  Maximize2,
  Minimize2,
  Waves,
  Zap
} from 'lucide-react';

interface WindowInfo {
  hwnd: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (session: RecordingSession) => void;
}

export const RecorderModal: React.FC<RecorderModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'screen' | 'window'>('screen');
  const [windowsList, setWindowsList] = useState<WindowInfo[]>([]);
  const [selectedHwnd, setSelectedHwnd] = useState<number | null>(null);
  const [selectedScreenIndex, setSelectedScreenIndex] = useState<number>(0);
  const [isLoadingWindows, setIsLoadingWindows] = useState(false);

  // Modal animation & resize state
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnimatedClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 190);
  }, [onClose]);

  // Settings
  const [targetFps, setTargetFps] = useState<number>(60);
  const [recordMic, setRecordMic] = useState(false);
  const [recordSystemAudio, setRecordSystemAudio] = useState(true);
  const [recordKeys, setRecordKeys] = useState(true);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(false);
  const [easeType, setEaseType] = useState<'spring' | 'easeInOut' | 'linear'>('spring');
  const [transitionDuration, setTransitionDuration] = useState<number>(0.35);

  // Countdown & Recording state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const startTimeRef = useRef<number>(0);
  const isStoppingRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);
  const pollGraceTimeoutRef = useRef<any>(null);
  const unlistenSignalRef = useRef<(() => void) | null>(null);

  // Fallback for browser mode only
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webMousePointsRef = useRef<MousePoint[]>([]);
  const webClicksRef = useRef<ClickEvent[]>([]);

  const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  // Refresh windows list from Tauri
  const fetchWindows = useCallback(async () => {
    if (!hasTauri) return;
    setIsLoadingWindows(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const wins = await invoke<WindowInfo[]>('list_open_windows');
      setWindowsList(wins || []);
      if (wins && wins.length > 0 && selectedHwnd === null) {
        setSelectedHwnd(wins[0].hwnd);
      }
    } catch (err) {
      console.warn('Failed to fetch windows:', err);
    } finally {
      setIsLoadingWindows(false);
    }
  }, [hasTauri, selectedHwnd]);

  useEffect(() => {
    if (isOpen && !isRecording && !isStarting) {
      fetchWindows();
    }
  }, [isOpen, isRecording, isStarting, fetchWindows]);

  const stopRecording = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    if (hasTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res: any = await invoke('stop_native_capture');
        await invoke('show_window');

        if (res && res.video_path) {
          let videoUrl = '';
          let blob: Blob | null = null;

          try {
            const rawBytes = await invoke<ArrayBuffer | number[]>('read_recorded_video_bytes', {
              filePath: res.video_path,
            });
            if (rawBytes) {
              const uint8 = rawBytes instanceof ArrayBuffer ? new Uint8Array(rawBytes) : new Uint8Array(rawBytes as number[]);
              if (uint8.byteLength > 0) {
                blob = new Blob([uint8], { type: 'video/mp4' });
                videoUrl = URL.createObjectURL(blob);
              }
            }
          } catch (e) {
            console.warn('Direct byte read failed, falling back to convertFileSrc:', e);
          }

          if (!videoUrl) {
            try {
              const { convertFileSrc } = await import('@tauri-apps/api/core');
              videoUrl = convertFileSrc(res.video_path);
            } catch (err) {
              console.error('convertFileSrc fallback error:', err);
            }
          }

          if (videoUrl) {
            const durationSec = Math.max(1, (res.duration_ms || (Date.now() - startTimeRef.current)) / 1000);
            const points: MousePoint[] = res.points || [];
            const clicks: ClickEvent[] = res.clicks || [];
            const keyEvents = recordKeys ? (res.key_events || []) : [];
            const autoZoomBlocks = autoZoomEnabled ? generateAutoZoomBlocks(clicks, 2.2, 0.3, 0.75, points, easeType) : [];

            const newSession: RecordingSession = {
              videoUrl,
              videoBlob: blob,
              videoWidth: res.screen_width || 1920,
              videoHeight: res.screen_height || 1080,
              duration: Number(durationSec.toFixed(2)),
              mousePoints: points,
              clicks: clicks,
              keyEvents: keyEvents,
              zoomBlocks: autoZoomBlocks,
              selectedBlockId: autoZoomBlocks[0]?.id || null,
              currentTime: 0,
              isPlaying: false,
            };

            setIsRecording(false);
            setIsStarting(false);
            setCountdown(null);
            onRecordingComplete(newSession);
            onClose();
            return;
          }
        }
      } catch (err) {
        console.error('Stop native recording error:', err);
      }
      setIsRecording(false);
      setIsStarting(false);
      setCountdown(null);
      onClose();
      return;
    }

    // Fallback if pure web browser mode
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [hasTauri, autoZoomEnabled, recordKeys, easeType, onClose, onRecordingComplete]);

  // Listen to Global F9 / Escape & Tauri stop signal
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9' || e.key === 'Escape') {
        stopRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (hasTauri) {
      (async () => {
        try {
          const { listen } = await import('@tauri-apps/api/event');
          const unlisten = await listen('stop_recording_signal', () => {
            stopRecording();
          });
          unlistenSignalRef.current = unlisten;
        } catch (err) {
          console.warn('Could not listen to stop_recording_signal', err);
        }
      })();

      // Grace period: only poll active state after 1.5s to give native recorder ample time to start
      let inactiveCount = 0;
      pollGraceTimeoutRef.current = setTimeout(() => {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const active = await invoke<boolean>('is_mouse_recording_active');
            if (!active) {
              inactiveCount++;
              if (inactiveCount >= 2 && !isStoppingRef.current) {
                stopRecording();
              }
            } else {
              inactiveCount = 0;
            }
          } catch {}
        }, 500);
      }, 1500);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pollGraceTimeoutRef.current) {
        clearTimeout(pollGraceTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (unlistenSignalRef.current) {
        unlistenSignalRef.current();
        unlistenSignalRef.current = null;
      }
    };
  }, [isRecording, hasTauri, stopRecording]);

  const startActualRecording = async () => {
    try {
      isStoppingRef.current = false;
      const selectedWin = windowsList.find((w) => w.hwnd === selectedHwnd);
      const titleHint = activeTab === 'window' && selectedWin ? selectedWin.title : `screen:${selectedScreenIndex}`;
      startTimeRef.current = Date.now();

      // In Tauri: 100% Native Rust Recording
      if (hasTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        if (activeTab === 'window' && selectedWin) {
          await invoke('focus_target_window', { hwnd: selectedWin.hwnd });
        }
        
        try {
          await invoke('start_native_capture', {
            hwnd: activeTab === 'window' && selectedWin ? selectedWin.hwnd : null,
            screenIndex: activeTab === 'screen' ? selectedScreenIndex : null,
            titleHint,
            fps: targetFps,
          });
          // Do not hide app window so the app can record itself in full screen and window modes
          setIsStarting(false);
          setIsRecording(true);
          setCountdown(null);
          return;
        } catch (captureErr) {
          console.error('Failed to start native capture:', captureErr);
          await invoke('show_window');
          setIsStarting(false);
          setIsRecording(false);
          setCountdown(null);
          return;
        }
      }

      // Pure Browser Mode only
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: activeTab === 'window' ? 'window' : 'monitor',
          frameRate: { ideal: 60, max: 60 },
        },
        audio: recordSystemAudio,
      } as any);

      streamRef.current = displayStream;
      recordedChunksRef.current = [];
      webMousePointsRef.current = [];
      webClicksRef.current = [];

      const mediaRecorder = new MediaRecorder(displayStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
        videoBitsPerSecond: 18000000,
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        const durationSec = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
        const autoZoomBlocks = autoZoomEnabled ? generateAutoZoomBlocks(webClicksRef.current, 2.2) : [];

        const newSession: RecordingSession = {
          videoUrl,
          videoBlob: blob,
          videoWidth: 1920,
          videoHeight: 1080,
          duration: Number(durationSec.toFixed(2)),
          mousePoints: webMousePointsRef.current,
          clicks: webClicksRef.current,
          zoomBlocks: autoZoomBlocks,
          selectedBlockId: autoZoomBlocks[0]?.id || null,
          currentTime: 0,
          isPlaying: false,
        };

        displayStream.getTracks().forEach((t) => t.stop());
        setIsStarting(false);
        setIsRecording(false);
        setCountdown(null);
        onRecordingComplete(newSession);
        onClose();
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsStarting(false);
      setIsRecording(true);
      setCountdown(null);
    } catch (err) {
      console.log('Recording cancelled or failed', err);
      setIsStarting(false);
      setCountdown(null);
      setIsRecording(false);
    }
  };

  const handleStartCountdown = () => {
    isStoppingRef.current = false;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return null;
        }
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setIsStarting(true);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!isOpen) return null;

  // 3-2-1 Countdown Fullscreen Overlay OR starting capture transition
  if (countdown !== null || isStarting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-fade-in select-none">
        <div className="text-center">
          <div 
            key={countdown ?? 'starting'}
            className="w-36 h-36 rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-text)] flex items-center justify-center text-8xl font-black shadow-2xl mx-auto mb-5 border-4 border-white/30 animate-modal-pop"
          >
            {countdown !== null ? countdown : '⚡'}
          </div>
          <p className="text-white text-xl font-bold tracking-wide">
            {countdown !== null ? 'Chuẩn bị ghi hình...' : 'Đang bắt đầu ghi hình...'}
          </p>
          <p className="text-white/80 text-sm mt-2 flex items-center justify-center gap-2">
            <span>Nhấn</span>
            <kbd className="keycap text-zinc-950 bg-white font-black text-sm px-3 py-1">F9</kbd>
            <span>bất kỳ lúc nào để DỪNG QUAY</span>
          </p>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return null;
  }

  const StudioToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[var(--accent-primary)]' : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

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
        className={`w-full ${
          isExpanded ? 'max-w-3xl w-[92vw]' : 'max-w-lg'
        } max-h-[88vh] rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-card)] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isClosing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-inner)] bg-[var(--bg-card)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">Ghi hình Studio Native</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">Ghi hình trực tiếp 60 FPS & bắt trọn từng cú click</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-inner)] transition-all duration-150 cursor-pointer active:scale-90"
              title={isExpanded ? 'Thu nhỏ kích thước' : 'Phóng to kích thước'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={handleAnimatedClose}
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-inner)] transition-all duration-150 cursor-pointer active:scale-90"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Target Selection Floating Pill Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-inner)] gap-1">
            <button
              onClick={() => setActiveTab('screen')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'screen'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <Monitor size={18} />
              <span>Toàn màn hình</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('window');
                fetchWindows();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'window'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <AppWindow size={18} />
              <span>Cửa sổ ứng dụng</span>
            </button>
          </div>

          {/* Target List */}
          {activeTab === 'screen' ? (
            <div className="grid grid-cols-2 gap-3.5">
              <div
                onClick={() => setSelectedScreenIndex(0)}
                className={`p-4 rounded-3xl border-2 cursor-pointer transition-all duration-150 flex flex-col items-center text-center gap-3 ${
                  selectedScreenIndex === 0
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] shadow-sm'
                    : 'border-[var(--border-inner)] bg-[var(--bg-card-inner)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="w-14 h-11 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-inner)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                  <Monitor size={26} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-main)]">Màn hình chính (1)</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium">Full HD / 4K Display</div>
                </div>
              </div>

              <div
                onClick={() => setSelectedScreenIndex(1)}
                className={`p-4 rounded-3xl border-2 cursor-pointer transition-all duration-150 flex flex-col items-center text-center gap-3 opacity-80 ${
                  selectedScreenIndex === 1
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] shadow-sm'
                    : 'border-[var(--border-inner)] bg-[var(--bg-card-inner)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="w-14 h-11 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-inner)] flex items-center justify-center text-[var(--text-muted)]">
                  <Layers size={26} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-main)]">Màn hình phụ (2)</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium">Secondary Monitor</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                <span>Chọn ứng dụng cần ghi:</span>
                <button
                  onClick={fetchWindows}
                  className="flex items-center gap-1.5 hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoadingWindows ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {windowsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    Đang tìm các cửa sổ ứng dụng đang mở...
                  </div>
                ) : (
                  windowsList.map((win) => {
                    const isSelfApp = win.title.toLowerCase().includes('lyangrecorder') || 
                                      win.title.toLowerCase().includes('captist') ||
                                      win.title.toLowerCase().includes('smart auto-zoom');
                    return (
                      <div
                        key={win.hwnd}
                        onClick={() => setSelectedHwnd(win.hwnd)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-150 ${
                          selectedHwnd === win.hwnd
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] font-bold text-[var(--accent-primary)] shadow-sm'
                            : 'border-[var(--border-inner)] bg-[var(--bg-card-inner)] hover:bg-[var(--bg-card)] text-[var(--text-main)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <AppWindow size={18} className="shrink-0 text-[var(--accent-primary)]" />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs truncate font-bold">{win.title}</span>
                            {isSelfApp && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-extrabold shrink-0 border border-[var(--accent-primary)]/30">
                                Ứng dụng này
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] shrink-0 font-mono">
                          {win.width}x{win.height}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Feature Switches Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-inner)] space-y-3 shadow-2xs">
            {/* Audio 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-main)]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${recordSystemAudio ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                  {recordSystemAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </div>
                <div>
                  <div className="font-bold text-xs">Âm thanh hệ thống</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Ghi lại tiếng máy tính & thông báo</div>
                </div>
              </div>
              <StudioToggle checked={recordSystemAudio} onChange={setRecordSystemAudio} />
            </div>

            <div className="h-[1px] bg-[var(--border-inner)]" />

            {/* Mic */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-main)]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${recordMic ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                  {recordMic ? <Mic size={16} /> : <MicOff size={16} />}
                </div>
                <div>
                  <div className="font-bold text-xs">Microphone thu âm</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Thu âm giọng nói bình luận</div>
                </div>
              </div>
              <StudioToggle checked={recordMic} onChange={setRecordMic} />
            </div>

            <div className="h-[1px] bg-[var(--border-inner)]" />

            {/* Keystrokes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-main)]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${recordKeys ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                  <Keyboard size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs">Ghi nhận phím bấm (Keystrokes)</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Nổi tổ hợp phím tắt (Ctrl+C, Enter...)</div>
                </div>
              </div>
              <StudioToggle checked={recordKeys} onChange={setRecordKeys} />
            </div>

            <div className="h-[1px] bg-[var(--border-inner)]" />

            {/* Smart Auto-Zoom */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-[var(--text-main)]">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${autoZoomEnabled ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                    <MousePointer size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Smart Auto-Zoom</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-medium">Tự động phóng to theo thao tác click</div>
                  </div>
                </div>
                <StudioToggle checked={autoZoomEnabled} onChange={setAutoZoomEnabled} />
              </div>

              {/* Easing Transition Controls - Only visible when Auto-Zoom is enabled */}
              {autoZoomEnabled && (
                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-inner)] space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-main)]">Kiểu chuyển động Zoom</span>
                    <span className="text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--bg-card-inner)] px-2 py-0.5 rounded-full border border-[var(--border-inner)]">
                      {easeType === 'spring' ? 'Spring Nảy Mượt' : easeType === 'easeInOut' ? 'EaseInOut Mềm' : 'Linear Đều'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEaseType('spring')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        easeType === 'spring'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                          : 'bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-inner)]'
                      }`}
                    >
                      <Sparkles size={14} />
                      <span className="text-[10px]">Spring (Apple)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEaseType('easeInOut')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        easeType === 'easeInOut'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                          : 'bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-inner)]'
                      }`}
                    >
                      <Waves size={14} />
                      <span className="text-[10px]">EaseInOut</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEaseType('linear')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        easeType === 'linear'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                          : 'bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-inner)]'
                      }`}
                    >
                      <Zap size={14} />
                      <span className="text-[10px]">Linear</span>
                    </button>
                  </div>

                  {/* Transition Speed Slider */}
                  <div className="pt-2 border-t border-[var(--border-inner)] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[var(--text-muted)]">Độ trễ chuyển cảnh (Speed)</span>
                      <span className="font-mono text-[var(--accent-primary)] font-extrabold bg-[var(--bg-card-inner)] px-2 py-0.5 rounded-full border border-[var(--border-inner)] text-[10px]">
                        {transitionDuration.toFixed(2)}s
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0.15"
                      max="0.75"
                      step="0.05"
                      value={transitionDuration}
                      onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                      className="w-full"
                    />

                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      {[
                        { val: 0.20, label: '0.20s Nhanh' },
                        { val: 0.35, label: '0.35s Chuẩn' },
                        { val: 0.50, label: '0.50s Êm' },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setTransitionDuration(p.val)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                            Math.abs(transitionDuration - p.val) < 0.01
                              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                              : 'bg-[var(--bg-card-inner)] text-[var(--text-muted)] border-[var(--border-inner)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-[var(--border-inner)]" />

            {/* FPS & Performance Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-main)]">
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-card)] text-emerald-500 flex items-center justify-center">
                  <Cpu size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-2">
                    <span>Tốc độ khung hình (FPS)</span>
                    {targetFps === 30 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold">
                        Eco GPU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">
                    {targetFps === 60 ? '60 FPS: Mượt mà cao cấp' : '30 FPS: Tiết kiệm tài nguyên'}
                  </div>
                </div>
              </div>

              <div className="flex items-center bg-[var(--bg-card)] p-0.5 rounded-full border border-[var(--border-inner)] gap-1">
                <button
                  type="button"
                  onClick={() => setTargetFps(30)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    targetFps === 30
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  30 FPS
                </button>
                <button
                  type="button"
                  onClick={() => setTargetFps(60)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    targetFps === 60
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  60 FPS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Fixed at bottom */}
        <div className="px-6 py-3.5 border-t border-[var(--border-inner)] bg-[var(--bg-card)] shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleStartCountdown}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] text-xs font-extrabold transition-all duration-200 shadow-md hover:shadow-emerald-500/25 active:scale-95 cursor-pointer"
          >
            <Play size={14} className="fill-current" />
            <span>Bắt đầu quay ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
