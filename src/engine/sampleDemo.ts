import { MousePoint, ClickEvent, KeyEvent, RecordingSession } from '../types';

// Creates a synthetic animated video canvas blob representing an active coding/web session
export function createDemoCanvasVideo(durationSeconds: number = 10): Promise<{
  videoBlob: Blob;
  videoUrl: string;
  mousePoints: MousePoint[];
  clicks: ClickEvent[];
}> {
  return new Promise((resolve) => {
    const width = 1280;
    const height = 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const fps = 30;
    const totalFrames = durationSeconds * fps;
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: 6000000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const mousePoints: MousePoint[] = [];
    const clicks: ClickEvent[] = [
      {
        id: 'click_1',
        t: 1800,
        x: 0.22,
        y: 0.32,
        button: 'left',
      },
      {
        id: 'click_2',
        t: 4600,
        x: 0.72,
        y: 0.45,
        button: 'left',
      },
      {
        id: 'click_3',
        t: 7500,
        x: 0.48,
        y: 0.68,
        button: 'left',
      },
    ];

    // Generate smooth mouse trajectory
    for (let i = 0; i <= totalFrames; i++) {
      const tMs = (i / fps) * 1000;
      let x = 0.1;
      let y = 0.1;

      if (tMs < 1800) {
        const p = tMs / 1800;
        x = 0.1 + (0.22 - 0.1) * p;
        y = 0.15 + (0.32 - 0.15) * p;
      } else if (tMs < 4600) {
        const p = (tMs - 1800) / (4600 - 1800);
        x = 0.22 + (0.72 - 0.22) * (p * p * (3 - 2 * p));
        y = 0.32 + (0.45 - 0.32) * (p * p * (3 - 2 * p));
      } else if (tMs < 7500) {
        const p = (tMs - 4600) / (7500 - 4600);
        x = 0.72 + (0.48 - 0.72) * (p * p * (3 - 2 * p));
        y = 0.45 + (0.68 - 0.45) * (p * p * (3 - 2 * p));
      } else {
        const p = (tMs - 7500) / (durationSeconds * 1000 - 7500);
        x = 0.48 + 0.15 * Math.sin(p * Math.PI);
        y = 0.68 - 0.2 * p;
      }

      mousePoints.push({ t: Math.round(tMs), x, y });
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve({
        videoBlob: blob,
        videoUrl: url,
        mousePoints,
        clicks,
      });
    };

    mediaRecorder.start();

    // Render frames into canvas
    let currentFrame = 0;
    const interval = setInterval(() => {
      // Draw modern IDE / Web UI mockup
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, width, height);

      // Top bar
      ctx.fillStyle = '#181825';
      ctx.fillRect(0, 0, width, 40);
      ctx.fillStyle = '#89b4fa';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('⚡ Captist Interactive Studio Demo - screen_recording.ts', 24, 25);

      // Left sidebar
      ctx.fillStyle = '#11111b';
      ctx.fillRect(0, 40, 240, height - 40);
      ctx.fillStyle = '#6c7086';
      ctx.font = '13px sans-serif';
      ctx.fillText('EXPLORER', 20, 70);
      ctx.fillStyle = '#cdd6f4';
      ctx.fillText('📁 src/engine/camera.ts', 20, 100);
      ctx.fillText('📁 src/engine/autoZoom.ts', 20, 130);
      ctx.fillText('📄 App.tsx', 20, 160);
      ctx.fillText('📄 README.md', 20, 190);

      // Main Code Editor area
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(240, 40, width - 240, height - 40);

      // Code lines
      ctx.font = '15px monospace';
      const lines = [
        { text: '// ✨ Auto-zoom to click coordinates with spring physics', color: '#6c7086' },
        { text: 'export function autoZoomToClick(event: MouseClick) {', color: '#cba6f7' },
        { text: '  const focalPoint = { x: event.x, y: event.y };', color: '#89b4fa' },
        { text: '  const camera = smoothSpringInterpolation(focalPoint, {', color: '#f38ba8' },
        { text: '    zoom: 2.2,', color: '#fab387' },
        { text: '    stiffness: 180,', color: '#fab387' },
        { text: '    damping: 14,', color: '#fab387' },
        { text: '  });', color: '#f38ba8' },
        { text: '  return camera.renderViewport();', color: '#a6e3a1' },
        { text: '}', color: '#cba6f7' },
      ];

      lines.forEach((line, idx) => {
        ctx.fillStyle = line.color;
        ctx.fillText(`${idx + 1}   ${line.text}`, 260, 80 + idx * 30);
      });

      // Target Click Highlights (visual buttons on simulated screen)
      // Button 1 at (0.22, 0.32)
      ctx.fillStyle = '#313244';
      ctx.fillRect(width * 0.22 - 60, height * 0.32 - 18, 120, 36);
      ctx.fillStyle = '#89b4fa';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('⚡ Run AutoZoom', width * 0.22 - 48, height * 0.32 + 5);

      // Card 2 at (0.72, 0.45)
      ctx.fillStyle = '#313244';
      ctx.fillRect(width * 0.72 - 80, height * 0.45 - 40, 160, 80);
      ctx.fillStyle = '#a6e3a1';
      ctx.fillText('🚀 60 FPS Export', width * 0.72 - 60, height * 0.45 - 10);
      ctx.fillStyle = '#bac2de';
      ctx.font = '12px sans-serif';
      ctx.fillText('Ultra 4K & MP4/WebM', width * 0.72 - 65, height * 0.45 + 15);

      // Button 3 at (0.48, 0.68)
      ctx.fillStyle = '#45475a';
      ctx.fillRect(width * 0.48 - 70, height * 0.68 - 20, 140, 40);
      ctx.fillStyle = '#f38ba8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('✨ Beautify Video', width * 0.48 - 55, height * 0.68 + 5);

      // Stable code editor cursor
      ctx.fillStyle = '#f5e0dc';
      ctx.fillRect(260 + 380, 80 + 8 * 30 - 15, 2, 20);

      currentFrame++;
      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        mediaRecorder.stop();
      }
    }, 1000 / fps);
  });
}

export async function generateDemoSession(): Promise<RecordingSession> {
  const demo = await createDemoCanvasVideo(10);

  const demoKeyEvents: KeyEvent[] = [
    { id: 'key_1', t: 2200, key: 'Ctrl + C', isShortcut: true },
    { id: 'key_2', t: 5000, key: 'Ctrl + V', isShortcut: true },
    { id: 'key_3', t: 7800, key: 'Enter', isShortcut: false },
  ];

  return {
    videoUrl: demo.videoUrl,
    videoBlob: demo.videoBlob,
    videoWidth: 1280,
    videoHeight: 720,
    duration: 10,
    mousePoints: demo.mousePoints,
    clicks: demo.clicks,
    keyEvents: demoKeyEvents,
    zoomBlocks: [],
    selectedBlockId: null,
    currentTime: 0,
    isPlaying: false,
  };
}

