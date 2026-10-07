import { ZoomBlock } from '../types';

export interface CameraState {
  zoom: number; // 1.0 to 4.0
  centerX: number; // 0..1 (normalized in original video)
  centerY: number; // 0..1
  // Source crop rectangle in video space:
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
}

// Cubic Bezier / Ease function for buttery smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function computeCameraState(
  currentTime: number, // in seconds
  zoomBlocks: ZoomBlock[],
  videoWidth: number,
  videoHeight: number,
  transitionDuration: number = 0.35, // seconds (snappy, responsive)
  currentCursor?: { x: number; y: number } | null,
  followCursor: boolean = true
): CameraState {
  // Default unzoomed 1.0x centered
  let targetZoom = 1.0;
  let targetX = 0.5;
  let targetY = 0.5;

  // Find active or adjacent blocks
  // Sort blocks chronologically
  const sorted = [...zoomBlocks].sort((a, b) => a.startTime - b.startTime);

  for (let i = 0; i < sorted.length; i++) {
    const block = sorted[i];
    const trans = Math.min(transitionDuration, (block.endTime - block.startTime) / 2);

    if (currentTime >= block.startTime && currentTime <= block.endTime) {
      // Inside active block
      const progressIn = (currentTime - block.startTime) / trans;
      const progressOut = (block.endTime - currentTime) / trans;

      if (progressIn < 1.0) {
        // Easing in
        const ease = easeInOutCubic(progressIn);
        targetZoom = 1.0 + (block.zoomLevel - 1.0) * ease;
        targetX = 0.5 + (block.targetX - 0.5) * ease;
        targetY = 0.5 + (block.targetY - 0.5) * ease;
      } else if (progressOut < 1.0) {
        // Check if next block immediately follows
        const nextBlock = sorted[i + 1];
        if (nextBlock && nextBlock.startTime <= block.endTime + 0.1) {
          // Transitioning directly to next block
          const blend = 1 - progressOut;
          const ease = easeInOutCubic(blend);
          targetZoom = block.zoomLevel + (nextBlock.zoomLevel - block.zoomLevel) * ease;
          targetX = block.targetX + (nextBlock.targetX - block.targetX) * ease;
          targetY = block.targetY + (nextBlock.targetY - block.targetY) * ease;
        } else {
          // Easing back to normal 1.0x smoothly & rapidly
          const ease = easeInOutCubic(progressOut);
          targetZoom = 1.0 + (block.zoomLevel - 1.0) * ease;
          targetX = 0.5 + (block.targetX - 0.5) * ease;
          targetY = 0.5 + (block.targetY - 0.5) * ease;
        }
      } else {
        // Sustained full zoom
        targetZoom = block.zoomLevel;
        targetX = block.targetX;
        targetY = block.targetY;
      }
      break;
    }
  }

  // Dynamic Cursor Tracking: if zoomed in and cursor moves, smoothly bias center towards cursor
  if (followCursor && currentCursor && targetZoom > 1.05) {
    const bias = 0.4 * Math.min(1.0, (targetZoom - 1.0) / 1.2);
    targetX = targetX * (1 - bias) + currentCursor.x * bias;
    targetY = targetY * (1 - bias) + currentCursor.y * bias;
  }

  // Calculate clamped source crop rectangle
  const srcW = videoWidth / targetZoom;
  const srcH = videoHeight / targetZoom;

  // Center the crop on targetX * videoWidth, targetY * videoHeight
  let srcX = targetX * videoWidth - srcW / 2;
  let srcY = targetY * videoHeight - srcH / 2;

  // Safe margin check: ensure moving cursor never gets clipped outside visible viewport
  if (followCursor && currentCursor && targetZoom > 1.05) {
    const curPx = currentCursor.x * videoWidth;
    const curPy = currentCursor.y * videoHeight;
    const padX = srcW * 0.14;
    const padY = srcH * 0.14;

    if (curPx < srcX + padX) srcX = curPx - padX;
    if (curPx > srcX + srcW - padX) srcX = curPx - srcW + padX;
    if (curPy < srcY + padY) srcY = curPy - padY;
    if (curPy > srcY + srcH - padY) srcY = curPy - srcH + padY;
  }

  srcX = Math.max(0, Math.min(videoWidth - srcW, srcX));
  srcY = Math.max(0, Math.min(videoHeight - srcH, srcY));

  return {
    zoom: targetZoom,
    centerX: targetX,
    centerY: targetY,
    srcX,
    srcY,
    srcW,
    srcH,
  };
}
