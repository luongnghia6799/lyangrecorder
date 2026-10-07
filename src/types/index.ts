export interface MousePoint {
  t: number; // milliseconds from start
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  px?: number;
  py?: number;
}

export interface ClickEvent {
  id: string;
  t: number; // milliseconds from start
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  button: 'left' | 'right' | 'middle';
  px?: number;
  py?: number;
}

export interface KeyEvent {
  id: string;
  t: number; // milliseconds from start
  key: string; // e.g. "Ctrl + C", "Enter", "Alt + Tab"
  isShortcut: boolean;
}

export interface ZoomBlock {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  targetX: number; // normalized 0..1 (where the zoom centers)
  targetY: number; // normalized 0..1
  zoomLevel: number; // e.g. 1.5x, 2.0x, 3.0x
  easeType: 'spring' | 'easeInOut' | 'linear';
  isAuto?: boolean;
  label?: string;
}

export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:3' | 'auto';
export type BackgroundType = 'gradient' | 'mesh' | 'solid' | 'transparent' | 'image';
export type CursorStyleType = 'macos' | 'modern-dark' | 'modern-light' | 'circle-glow' | 'crosshair';
export type ClickEffectType = 'ripple' | 'glow-pulse' | 'sonar' | 'particle' | 'none';
export type WindowFrameType = 'none' | 'macos-dark' | 'macos-light' | 'browser' | 'minimal-border';

export interface VideoStyleSettings {
  aspectRatio: AspectRatioType;
  padding: number; // canvas padding in px (0 - 140)
  borderRadius: number; // video corner radius (0 - 48)
  shadowIntensity: 'none' | 'soft' | 'medium' | 'deep' | 'glow';
  backgroundType: BackgroundType;
  backgroundId: string;
  customBgColor: string;
  customBgImage?: string | null;
  backgroundBlur?: number; // 0 - 50 px blur
  windowFrame: WindowFrameType;
  
  // Cursor settings
  showCursor: boolean;
  cursorStyle: CursorStyleType;
  cursorSize: number; // 18 - 48
  cursorSmoothness: number; // 0.1 - 1.0 (interpolation spring)
  
  // Click effects
  clickEffect: ClickEffectType;
  clickColor: string;
  clickSize: number; // 20 - 80
  playClickSound: boolean;
  
  // Keyboard Strokes Overlay
  showKeyStrokes: boolean;
  keyStrokeStyle: 'badge' | 'glass' | 'minimal';
  keyStrokePosition: 'bottom-center' | 'bottom-left' | 'bottom-right';

  // Playback & Audio
  playbackSpeed: number; // 0.5 - 2.0
  volume: number; // 0 - 1
  muteAudio: boolean;
  autoFollowCursor: boolean;
}

export interface RecordingSession {
  videoUrl: string | null;
  videoBlob: Blob | null;
  videoWidth: number;
  videoHeight: number;
  duration: number; // in seconds
  mousePoints: MousePoint[];
  clicks: ClickEvent[];
  keyEvents?: KeyEvent[];
  zoomBlocks: ZoomBlock[];
  selectedBlockId: string | null;
  currentTime: number;
  isPlaying: boolean;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '1440p' | '4k';
  fps: 30 | 60;
  format: 'mp4' | 'webm' | 'gif';
  quality: 'high' | 'ultra' | 'medium';
}

export interface AppWindowInfo {
  hwnd: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
