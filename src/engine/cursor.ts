import { MousePoint, ClickEvent, CursorStyleType, ClickEffectType } from '../types';

export function getInterpolatedCursor(
  currentTimeMs: number,
  points: MousePoint[]
): { x: number; y: number; visible: boolean } | null {
  if (!points || points.length === 0) return null;

  if (currentTimeMs <= points[0].t) {
    return { x: points[0].x, y: points[0].y, visible: true };
  }
  if (currentTimeMs >= points[points.length - 1].t) {
    const last = points[points.length - 1];
    return { x: last.x, y: last.y, visible: true };
  }

  // Binary search for closest points
  let low = 0;
  let high = points.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid].t <= currentTimeMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const p0 = points[Math.max(0, high)];
  const p1 = points[Math.min(points.length - 1, low)];

  if (p0.t === p1.t) {
    return { x: p0.x, y: p0.y, visible: true };
  }

  const alpha = (currentTimeMs - p0.t) / (p1.t - p0.t);
  // Smooth cubic spring interpolation
  const easeAlpha = alpha * alpha * (3 - 2 * alpha);
  const x = p0.x + (p1.x - p0.x) * easeAlpha;
  const y = p0.y + (p1.y - p0.y) * easeAlpha;

  return { x, y, visible: true };
}

export function drawCursor(
  ctx: CanvasRenderingContext2D,
  x: number, // canvas pixel coords
  y: number,
  style: CursorStyleType,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  if (style === 'macos') {
    // Authentic macOS pointer vector geometry
    const s = size / 24;
    ctx.scale(s, s);

    // Step 1: Smooth drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    const path = new Path2D('M 0,0 L 0,19.5 L 4.8,15.2 L 8.2,23.0 L 11.8,21.4 L 8.2,13.8 L 15.2,13.8 Z');

    // Draw solid dark body with shadow
    ctx.fillStyle = '#000000';
    ctx.fill(path);

    // Step 2: Clear shadow for crisp, sharp white border without blur
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
  } else if (style === 'modern-dark') {
    // Sleek minimal obsidian pointer with neon green stroke
    const s = size / 24;
    ctx.scale(s, s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    const path = new Path2D('M 2,2 L 9,20 L 12.5,13.5 L 19.5,10 Z');
    ctx.fillStyle = '#090d16';
    ctx.fill(path);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#00E599';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
  } else if (style === 'modern-light') {
    // Modern luxury white pointer with obsidian stroke
    const s = size / 24;
    ctx.scale(s, s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    const path = new Path2D('M 2,2 L 9,20 L 12.5,13.5 L 19.5,10 Z');
    ctx.fillStyle = '#ffffff';
    ctx.fill(path);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
  } else if (style === 'circle-glow') {
    // Concentric glowing radar beacon
    ctx.beginPath();
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 0.45);
    grad.addColorStop(0, '#10b981');
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.35)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = grad;
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.6;
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'crosshair') {
    // Precision HUD Crosshair
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
    ctx.moveTo(-size * 0.5, 0);
    ctx.lineTo(-size * 0.15, 0);
    ctx.moveTo(size * 0.15, 0);
    ctx.lineTo(size * 0.5, 0);
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(0, -size * 0.15);
    ctx.moveTo(0, size * 0.15);
    ctx.lineTo(0, size * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#38bdf8';
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawClickRipples(
  ctx: CanvasRenderingContext2D,
  currentTimeMs: number,
  clicks: ClickEvent[],
  videoToCanvasCoords: (normX: number, normY: number) => { x: number; y: number },
  effect: ClickEffectType,
  clickColor: string = '#38bdf8',
  maxSize: number = 60
) {
  if (effect === 'none' || !clicks || clicks.length === 0) return;

  const rippleDuration = 600; // ms

  for (const click of clicks) {
    const elapsed = currentTimeMs - click.t;
    if (elapsed >= 0 && elapsed <= rippleDuration) {
      const progress = elapsed / rippleDuration;
      const { x, y } = videoToCanvasCoords(click.x, click.y);

      ctx.save();
      ctx.translate(x, y);

      // Smooth cubic easing for expanding wave
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const radius = easeProgress * maxSize;
      const opacity = Math.max(0, 1.0 - Math.pow(progress, 1.2));

      if (effect === 'ripple' || effect === 'glow-pulse') {
        // Refined soft halo pulse (Screen Studio style)
        ctx.beginPath();
        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        haloGrad.addColorStop(0.6, `${clickColor}40`);
        haloGrad.addColorStop(1, `${clickColor}80`);
        ctx.fillStyle = haloGrad;
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Elegant thin outer ring
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = clickColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = Math.max(1, 2.5 * (1 - progress));
        ctx.stroke();

        // Subtle center flash
        if (progress < 0.25) {
          const flashAlpha = (0.25 - progress) / 0.25;
          ctx.beginPath();
          ctx.arc(0, 0, 6 * (1 - progress), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
          ctx.fill();
        }
      } else if (effect === 'sonar') {
        // Multiple concentric waves
        for (let i = 0; i < 2; i++) {
          const waveProgress = (progress + i * 0.3) % 1.0;
          const waveRadius = waveProgress * maxSize;
          const waveOpacity = (1.0 - waveProgress) * 0.7;

          ctx.beginPath();
          ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${waveOpacity})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      } else if (effect === 'particle') {
        // Delicate particle burst
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const dist = progress * maxSize * 1.1;
          const px = Math.cos(angle) * dist;
          const py = Math.sin(angle) * dist;
          const pSize = Math.max(0.5, 3 * (1 - progress));

          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244, 63, 94, ${opacity})`;
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }
}
