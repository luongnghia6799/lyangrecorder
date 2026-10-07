import React, { useState, useEffect, useRef } from 'react';
import { 
  RecordingSession, 
  VideoStyleSettings, 
  ZoomBlock, 
  AspectRatioType 
} from './types';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { ControlsSidebar } from './components/ControlsSidebar';
import { RecorderModal } from './components/RecorderModal';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { RawSaveModal } from './components/RawSaveModal';
import { generateAutoZoomBlocks } from './engine/autoZoom';

const DEFAULT_SETTINGS: VideoStyleSettings = {
  aspectRatio: '16:9',
  padding: 0,
  borderRadius: 0,
  shadowIntensity: 'none',
  backgroundType: 'gradient',
  backgroundId: 'warm-cream',
  customBgColor: '#FAF6EE',
  customBgImage: null,
  backgroundBlur: 0,
  windowFrame: 'none',
  showCursor: true,
  cursorStyle: 'circle-glow',
  cursorSize: 28,
  cursorSmoothness: 0.6,
  clickEffect: 'particle',
  clickColor: '#0D6832',
  clickSize: 52,
  playClickSound: false,
  showKeyStrokes: true,
  keyStrokeStyle: 'badge',
  keyStrokePosition: 'bottom-center',
  playbackSpeed: 1.0,
  volume: 1.0,
  muteAudio: false,
  autoFollowCursor: true,
};

export default function App() {
  const [session, setSession] = useState<RecordingSession>({
    videoUrl: null,
    videoBlob: null,
    videoWidth: 1920,
    videoHeight: 1080,
    duration: 0,
    mousePoints: [],
    clicks: [],
    keyEvents: [],
    zoomBlocks: [],
    selectedBlockId: null,
    currentTime: 0,
    isPlaying: false,
  });

  const [settings, setSettings] = useState<VideoStyleSettings>(DEFAULT_SETTINGS);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRawSaveOpen, setIsRawSaveOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'zoom' | 'frame' | 'bg' | 'cursor' | 'audio'>('zoom');
  const [theme, setTheme] = useState<'warm' | 'dark'>('warm');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-fullscreen on startup
  useEffect(() => {
    const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (hasTauri) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        getCurrentWindow().setFullscreen(true).catch((err) => {
          console.warn('Auto fullscreen error:', err);
        });
      });
    }
  }, []);

  // Sync hidden video element with playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = settings.playbackSpeed;
    video.muted = settings.muteAudio;

    if (session.isPlaying) {
      video.play().catch((e) => console.warn('Video play error:', e));
    } else {
      video.pause();
    }
  }, [session.isPlaying, settings.playbackSpeed, settings.muteAudio]);

  const toggleFullscreen = async () => {
    const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (hasTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        const isFull = await win.isFullscreen();
        await win.setFullscreen(!isFull);
        return;
      } catch (err) {
        console.warn('Tauri fullscreen error, falling back to HTML5', err);
      }
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'F9' || e.key === 'F9') {
        e.preventDefault();
        setIsRecorderOpen((prev) => !prev);
      } else if (e.code === 'F11' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyE' || e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsExportOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsRawSaveOpen((prev) => !prev);
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleAddZoomBlock();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (session.selectedBlockId) {
          e.preventDefault();
          handleDeleteZoomBlock(session.selectedBlockId);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        if (session.selectedBlockId) {
          setSession((s) => ({
            ...s,
            zoomBlocks: s.zoomBlocks.map((b) => 
              b.id === s.selectedBlockId 
                ? { ...b, zoomLevel: Number(Math.min(3.5, b.zoomLevel + 0.2).toFixed(1)) }
                : b
            ),
          }));
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        if (session.selectedBlockId) {
          setSession((s) => ({
            ...s,
            zoomBlocks: s.zoomBlocks.map((b) => 
              b.id === s.selectedBlockId 
                ? { ...b, zoomLevel: Number(Math.max(1.2, b.zoomLevel - 0.2).toFixed(1)) }
                : b
            ),
          }));
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        if (session.selectedBlockId) {
          setSession((s) => ({
            ...s,
            zoomBlocks: s.zoomBlocks.map((b) => 
              b.id === s.selectedBlockId 
                ? { ...b, zoomLevel: 2.2 }
                : b
            ),
          }));
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, session.currentTime - (e.shiftKey ? 2 : 0.5)));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(session.duration, session.currentTime + (e.shiftKey ? 2 : 0.5)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.currentTime, session.duration, session.selectedBlockId]);

  const togglePlay = () => {
    setSession((s) => ({ ...s, isPlaying: !s.isPlaying }));
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setSession((s) => ({ ...s, currentTime: newTime }));
  };

  const handleTimeUpdate = (time: number) => {
    setSession((s) => ({ ...s, currentTime: time }));
  };

  const handleAddZoomBlock = () => {
    const curTime = session.currentTime;
    const duration = Number.isFinite(session.duration) && session.duration > 0 ? session.duration : 10;
    const newBlock: ZoomBlock = {
      id: `zoom_${Date.now()}`,
      startTime: Number(Math.max(0, curTime - 0.2).toFixed(2)),
      endTime: Number(Math.min(duration, curTime + 1.8).toFixed(2)),
      targetX: 0.5,
      targetY: 0.5,
      zoomLevel: 2.2,
      easeType: 'spring',
      label: `Zoom ${(curTime).toFixed(1)}s`,
    };

    setSession((s) => ({
      ...s,
      zoomBlocks: [...s.zoomBlocks, newBlock],
      selectedBlockId: newBlock.id,
    }));
    setActiveSidebarTab('zoom');
    setIsInspectorOpen(true);
  };

  const handleUpdateZoomBlock = (updated: ZoomBlock) => {
    setSession((s) => ({
      ...s,
      zoomBlocks: s.zoomBlocks.map((b) => (b.id === updated.id ? updated : b)),
    }));
  };

  const handleDeleteZoomBlock = (id: string) => {
    setSession((s) => ({
      ...s,
      zoomBlocks: s.zoomBlocks.filter((b) => b.id !== id),
      selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
    }));
  };

  const handleSelectZoomBlock = (id: string | null) => {
    setSession((s) => ({ ...s, selectedBlockId: id }));
    if (id) {
      setActiveSidebarTab('zoom');
      setIsInspectorOpen(true);
    }
  };

  const handleAutoDetectZoom = () => {
    const blocks = generateAutoZoomBlocks(session.clicks, 2.2, 0.3, 0.75, session.mousePoints);
    setSession((s) => ({
      ...s,
      zoomBlocks: blocks,
      selectedBlockId: blocks[0]?.id || null,
    }));
    setActiveSidebarTab('zoom');
    setIsInspectorOpen(true);
  };

  const handleImportVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const isFiniteDur = Number.isFinite(tempVideo.duration) && tempVideo.duration > 0;
      const duration = isFiniteDur ? Number(tempVideo.duration.toFixed(2)) : 10;
      setSession({
        videoUrl: url,
        videoBlob: file,
        videoWidth: tempVideo.videoWidth || 1920,
        videoHeight: tempVideo.videoHeight || 1080,
        duration,
        mousePoints: [],
        clicks: [],
        zoomBlocks: [],
        selectedBlockId: null,
        currentTime: 0,
        isPlaying: false,
      });
    };
  };

  const toggleMute = () => {
    setSettings((s) => ({ ...s, muteAudio: !s.muteAudio }));
  };

  const toggleTheme = () => {
    setTheme((t) => (t === 'warm' ? 'dark' : 'warm'));
  };

  const selectedBlock = session.zoomBlocks.find((b) => b.id === session.selectedBlockId) || null;

  return (
    <div 
      data-theme={theme}
      className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200"
    >
      {/* Hidden Video Source Element used by Canvas Renderer */}
      {session.videoUrl && (
        <video
          key={session.videoUrl}
          ref={videoRef}
          src={session.videoUrl}
          className="fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-1 h-1"
          playsInline
          preload="auto"
          onEnded={() => setSession((s) => ({ ...s, isPlaying: false }))}
          onLoadedData={(e) => {
            const v = e.currentTarget;
            const isFiniteDur = Number.isFinite(v.duration) && v.duration > 0;
            setSession((s) => ({
              ...s,
              videoWidth: v.videoWidth || s.videoWidth,
              videoHeight: v.videoHeight || s.videoHeight,
              duration: isFiniteDur ? Number(v.duration.toFixed(2)) : (s.duration || 10),
            }));
          }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            const isFiniteDur = Number.isFinite(v.duration) && v.duration > 0;
            setSession((s) => ({
              ...s,
              videoWidth: v.videoWidth || s.videoWidth,
              videoHeight: v.videoHeight || s.videoHeight,
              duration: isFiniteDur ? Number(v.duration.toFixed(2)) : (s.duration || 10),
            }));
          }}
        />
      )}

      {/* 1. Top Modern Studio Header (Full width, No Sidebar) */}
      <Header
        aspectRatio={settings.aspectRatio}
        setAspectRatio={(ar: AspectRatioType) =>
          setSettings((s) => ({ ...s, aspectRatio: ar }))
        }
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onImportVideo={handleImportVideo}
        onAutoDetectZoom={handleAutoDetectZoom}
        theme={theme}
        onToggleTheme={toggleTheme}
        isMuted={settings.muteAudio}
        onToggleMute={toggleMute}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
      />

      {/* 2. Central Studio Workspace: Canvas & Timeline (Unified Studio Island) + Inspector Panel */}
      <main className="flex-1 flex overflow-hidden px-4 pt-1.5 pb-4 min-h-0">
        <CanvasPreview
          session={session}
          settings={settings}
          onTimeUpdate={handleTimeUpdate}
          onTogglePlay={togglePlay}
          onUpdateZoomBlock={handleUpdateZoomBlock}
          onSeek={handleSeek}
          onAddZoomBlock={handleAddZoomBlock}
          onDeleteZoomBlock={handleDeleteZoomBlock}
          onSelectZoomBlock={handleSelectZoomBlock}
          onAutoDetectZoom={handleAutoDetectZoom}
          videoRef={videoRef}
          isRecordingActive={isRecorderOpen}
          onOpenRecorder={() => setIsRecorderOpen(true)}
          onOpenRawSave={() => setIsRawSaveOpen(true)}
          onImportVideo={handleImportVideo}
        />

        {isInspectorOpen && (
          <ControlsSidebar
            settings={settings}
            setSettings={setSettings}
            selectedBlock={selectedBlock}
            onUpdateZoomBlock={handleUpdateZoomBlock}
            onDeleteZoomBlock={handleDeleteZoomBlock}
            activeTab={activeSidebarTab}
            setActiveTab={setActiveSidebarTab}
          />
        )}
      </main>

      {/* Screen Recorder Modal */}
      <RecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onRecordingComplete={(newSession) => {
          setIsRecorderOpen(false);
          setSession(newSession);
        }}
      />

      {/* 4K/60FPS Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        videoRef={videoRef}
        session={session}
        settings={settings}
      />

      {/* Raw Video Download & Default Save Folder Modal */}
      <RawSaveModal
        isOpen={isRawSaveOpen}
        onClose={() => setIsRawSaveOpen(false)}
        session={session}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
