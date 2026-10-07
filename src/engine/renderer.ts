import { computeCameraState, CameraState } from './camera';
import { getInterpolatedCursor, drawCursor, drawClickRipples } from './cursor';
import { getBackgroundPreset } from './backgrounds';
import { RecordingSession, VideoStyleSettings } from '../types';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  video: HTMLVideoElement;
  session: RecordingSession;
  settings: VideoStyleSettings;
  currentTime: number; // in seconds
}

export function getCanvasDimensions(aspectRatio: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '4:3':
      return { width: 1440, height: 1080 };
    case '16:9':
    case 'auto':
    default:
      return { width: 1920, height: 1080 };
  }
}

const bgImageCache = new Map<string, HTMLImageElement>();

function getOrLoadBgImage(url: string): HTMLImageElement {
  let img = bgImageCache.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    bgImageCache.set(url, img);
  }
  return img;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  session: RecordingSession,
  settings: VideoStyleSettings,
  currentTime: number,
  targetWidth: number,
  targetHeight: number
): { camera: CameraState; videoRect: { x: number; y: number; width: number; height: number } } {
  const { width: cw, height: ch } = { width: targetWidth, height: targetHeight };

  // 1. Draw Background (Skip completely when video is 100% full-bleed borderless to save GPU)
  const isFullBleed = settings.padding === 0 && settings.windowFrame === 'none' && settings.borderRadius === 0;

  if (!isFullBleed) {
    const blurVal = settings.backgroundBlur || 0;
    const blurScale = cw / 1920;
    const blurPx = blurVal * blurScale;

    ctx.save();
    if (blurPx > 0) {
      ctx.filter = `blur(${blurPx}px)`;
    }

    if (settings.customBgImage) {
      const bgImg = getOrLoadBgImage(settings.customBgImage);
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
        const canvasAspect = cw / ch;
        let drawW = cw;
        let drawH = ch;
        let offX = 0;
        let offY = 0;

        if (imgAspect > canvasAspect) {
          drawW = ch * imgAspect;
          offX = (cw - drawW) / 2;
        } else {
          drawH = cw / imgAspect;
          offY = (ch - drawH) / 2;
        }

        if (blurPx > 0) {
          const expand = blurPx * 2.5;
          ctx.drawImage(bgImg, offX - expand, offY - expand, drawW + expand * 2, drawH + expand * 2);
        } else {
          ctx.drawImage(bgImg, offX, offY, drawW, drawH);
        }
      } else {
        const bgPreset = getBackgroundPreset(settings.backgroundId);
        bgPreset.drawCanvas(ctx, cw, ch);
      }
    } else {
      const bgPreset = getBackgroundPreset(settings.backgroundId);
      if (blurPx > 0) {
        const expand = blurPx * 2.5;
        ctx.save();
        ctx.translate(-expand, -expand);
        bgPreset.drawCanvas(ctx, cw + expand * 2, ch + expand * 2);
        ctx.restore();
      } else {
        bgPreset.drawCanvas(ctx, cw, ch);
      }
    }

    ctx.restore();
  }

  // 2. Calculate Video Inset Window Rect
  const padding = settings.padding * (cw / 1920);
  const availW = cw - padding * 2;
  const availH = ch - padding * 2;

  const videoNativeW = video.videoWidth || session.videoWidth || 1920;
  const videoNativeH = video.videoHeight || session.videoHeight || 1080;
  const videoAspect = videoNativeW / videoNativeH;

  let destW = availW;
  let destH = availW / videoAspect;

  if (destH > availH) {
    destH = availH;
    destW = availH * videoAspect;
  }

  const destX = (cw - destW) / 2;
  const destY = (ch - destH) / 2;

  const titlebarHeight = settings.windowFrame.startsWith('macos') ? 34 * (cw / 1920) : 0;
  const totalWindowH = destH + titlebarHeight;
  const windowY = destY - titlebarHeight / 2;
  const videoY = windowY + titlebarHeight;

  // 3. Draw Window Shadow
  if (settings.shadowIntensity !== 'none') {
    ctx.save();
    let shadowBlur = 35 * (cw / 1920);
    let shadowY = 16 * (cw / 1920);
    let shadowColor = 'rgba(0, 0, 0, 0.45)';

    if (settings.shadowIntensity === 'soft') {
      shadowBlur = 20 * (cw / 1920);
      shadowY = 8 * (cw / 1920);
      shadowColor = 'rgba(0, 0, 0, 0.25)';
    } else if (settings.shadowIntensity === 'deep') {
      shadowBlur = 60 * (cw / 1920);
      shadowY = 28 * (cw / 1920);
      shadowColor = 'rgba(0, 0, 0, 0.65)';
    } else if (settings.shadowIntensity === 'glow') {
      shadowBlur = 45 * (cw / 1920);
      shadowY = 0;
      shadowColor = 'rgba(99, 102, 241, 0.4)';
    }

    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowY;

    // Draw shadow rounded rect
    const r = settings.borderRadius * (cw / 1920);
    drawRoundedRect(ctx, destX, windowY, destW, totalWindowH, r);
    ctx.fillStyle = '#090a0f';
    ctx.fill();
    ctx.restore();
  }

  // 4. Draw macOS Titlebar Window Header if enabled
  if (settings.windowFrame.startsWith('macos')) {
    ctx.save();
    const r = settings.borderRadius * (cw / 1920);
    
    // Header rounded top
    ctx.beginPath();
    ctx.moveTo(destX + r, windowY);
    ctx.lineTo(destX + destW - r, windowY);
    ctx.quadraticCurveTo(destX + destW, windowY, destX + destW, windowY + r);
    ctx.lineTo(destX + destW, videoY);
    ctx.lineTo(destX, videoY);
    ctx.lineTo(destX, windowY + r);
    ctx.quadraticCurveTo(destX, windowY, destX + r, windowY);
    ctx.closePath();

    ctx.fillStyle = settings.windowFrame === 'macos-dark' ? '#18181b' : '#f4f4f5';
    ctx.fill();

    // 3 Traffic light dots (Red, Yellow, Green)
    const dotRadius = 5.5 * (cw / 1920);
    const dotSpacing = 16 * (cw / 1920);
    const startDotX = destX + 18 * (cw / 1920);
    const dotY = windowY + titlebarHeight / 2;

    // Red
    ctx.beginPath();
    ctx.arc(startDotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Yellow
    ctx.beginPath();
    ctx.arc(startDotX + dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();

    // Green
    ctx.beginPath();
    ctx.arc(startDotX + dotSpacing * 2, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    ctx.restore();
  }

  // 5. Compute Smooth Zoom and Camera Viewport (with Dynamic Cursor Follow)
  const curTimeMs = currentTime * 1000;
  const currentCursor = session.mousePoints.length > 0 
    ? getInterpolatedCursor(curTimeMs, session.mousePoints) 
    : null;

  const camera = computeCameraState(
    currentTime,
    session.zoomBlocks,
    videoNativeW,
    videoNativeH,
    0.35,
    currentCursor,
    settings.autoFollowCursor !== false
  );

  // 6. Draw Clipped Video Frame with Camera Transform
  const rad = settings.borderRadius * (cw / 1920);
  const needsClip = settings.windowFrame.startsWith('macos') || rad > 0;

  if (needsClip) {
    ctx.save();
    if (settings.windowFrame.startsWith('macos')) {
      // Round only bottom corners if titlebar is present
      ctx.beginPath();
      ctx.moveTo(destX, videoY);
      ctx.lineTo(destX + destW, videoY);
      ctx.lineTo(destX + destW, videoY + destH - rad);
      ctx.quadraticCurveTo(destX + destW, videoY + destH, destX + destW - rad, videoY + destH);
      ctx.lineTo(destX + rad, videoY + destH);
      ctx.quadraticCurveTo(destX, videoY + destH, destX, videoY + destH - rad);
      ctx.closePath();
    } else {
      drawRoundedRect(ctx, destX, videoY, destW, destH, rad);
    }
    ctx.clip();
  }

  // Draw source sub-rect of video onto canvas
  if (video.readyState >= 2) {
    ctx.drawImage(
      video,
      camera.srcX,
      camera.srcY,
      camera.srcW,
      camera.srcH,
      destX,
      videoY,
      destW,
      destH
    );
  } else {
    // Video placeholder / loading state
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(destX, videoY, destW, destH);
  }

  if (needsClip) {
    ctx.restore();
  }

  // Coordinate transformation function: (normX, normY in video) -> (canvasX, canvasY)
  const videoToCanvas = (normX: number, normY: number) => {
    const rawPx = normX * videoNativeW;
    const rawPy = normY * videoNativeH;

    // Relative to camera crop
    const cropRelX = (rawPx - camera.srcX) / camera.srcW;
    const cropRelY = (rawPy - camera.srcY) / camera.srcH;

    return {
      x: destX + cropRelX * destW,
      y: videoY + cropRelY * destH,
    };
  };

  // 7. Draw Click Ripples & Pulse Effects
  drawClickRipples(
    ctx,
    curTimeMs,
    session.clicks,
    videoToCanvas,
    settings.clickEffect,
    settings.clickColor,
    settings.clickSize * (cw / 1920)
  );

  // 8. Draw Smooth Interpolated Cursor
  if (settings.showCursor && session.mousePoints.length > 0) {
    const cursor = getInterpolatedCursor(curTimeMs, session.mousePoints);
    if (cursor && cursor.visible) {
      const pos = videoToCanvas(cursor.x, cursor.y);
      // Ensure cursor is within or near the video window boundary
      if (
        pos.x >= destX - 20 &&
        pos.x <= destX + destW + 20 &&
        pos.y >= videoY - 20 &&
        pos.y <= videoY + destH + 20
      ) {
        drawCursor(
          ctx,
          pos.x,
          pos.y,
          settings.cursorStyle,
          settings.cursorSize * (cw / 1920)
        );
      }
    }
  }

  // 9. Draw Floating Keyboard Strokes / Shortcuts Overlay
  drawKeyStrokes(
    ctx,
    curTimeMs,
    session.keyEvents,
    settings,
    cw,
    ch,
    { x: destX, y: videoY, width: destW, height: destH }
  );

  return {
    camera,
    videoRect: { x: destX, y: videoY, width: destW, height: destH },
  };
}

function drawKeyStrokes(
  ctx: CanvasRenderingContext2D,
  curTimeMs: number,
  keyEvents: any[] | undefined,
  settings: VideoStyleSettings,
  cw: number,
  _ch: number,
  videoRect: { x: number; y: number; width: number; height: number }
) {
  if (!settings.showKeyStrokes || !keyEvents || keyEvents.length === 0) return;

  // Find recent key event active within last 1200ms
  const activeEvent = [...keyEvents]
    .reverse()
    .find((e) => curTimeMs >= e.t && curTimeMs <= e.t + 1200);

  if (!activeEvent) return;

  const ageMs = curTimeMs - activeEvent.t;
  let alpha = 1.0;
  if (ageMs < 100) {
    alpha = ageMs / 100; // fade in
  } else if (ageMs > 900) {
    alpha = Math.max(0, 1 - (ageMs - 900) / 300); // fade out
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  const scale = cw / 1920;
  const fontSize = Math.round(18 * scale);
  ctx.font = `700 ${fontSize}px "Segoe UI", -apple-system, sans-serif`;

  const text = activeEvent.key;
  const textMetrics = ctx.measureText(text);
  const padX = 20 * scale;
  const padY = 10 * scale;
  const boxW = textMetrics.width + padX * 2;
  const boxH = fontSize + padY * 2;

  // Position
  let boxX = (cw - boxW) / 2;
  if (settings.keyStrokePosition === 'bottom-left') {
    boxX = videoRect.x + 28 * scale;
  } else if (settings.keyStrokePosition === 'bottom-right') {
    boxX = videoRect.x + videoRect.width - boxW - 28 * scale;
  }
  const boxY = videoRect.y + videoRect.height - boxH - 24 * scale;

  // Draw background pill
  const r = 12 * scale;
  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, r);

  if (settings.keyStrokeStyle === 'glass') {
    ctx.fillStyle = 'rgba(19, 23, 31, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
  } else if (settings.keyStrokeStyle === 'minimal') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fill();
  } else {
    // Badge style with obsidian card + emerald accent
    ctx.fillStyle = '#13171F';
    ctx.fill();
    ctx.strokeStyle = '#0D6832';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
  }

  // Draw Key text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, boxX + boxW / 2, boxY + boxH / 2 + 1 * scale);

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
