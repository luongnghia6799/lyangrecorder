import { ClickEvent, MousePoint, ZoomBlock } from '../types';

export function generateAutoZoomBlocks(
  clicks: ClickEvent[],
  defaultZoomLevel: number = 2.0,
  preLeadTime: number = 0.3, // seconds before click to begin zooming
  postHoldTime: number = 0.75, // reduced from 1.4s for snappier zoom out
  mousePoints?: MousePoint[],
  easeType: 'spring' | 'easeInOut' | 'linear' = 'spring'
): ZoomBlock[] {
  if (!clicks || clicks.length === 0) return [];

  // Sort clicks chronologically
  const sortedClicks = [...clicks].sort((a, b) => a.t - b.t);

  const blocks: ZoomBlock[] = [];
  let currentGroup: ClickEvent[] = [];

  const clusterWindowMs = 1500; // clicks within 1.5s clustered

  for (let i = 0; i < sortedClicks.length; i++) {
    const click = sortedClicks[i];

    if (currentGroup.length === 0) {
      currentGroup.push(click);
    } else {
      const lastClick = currentGroup[currentGroup.length - 1];
      if (click.t - lastClick.t <= clusterWindowMs) {
        currentGroup.push(click);
      } else {
        blocks.push(createBlockFromCluster(currentGroup, defaultZoomLevel, preLeadTime, postHoldTime, mousePoints, easeType));
        currentGroup = [click];
      }
    }
  }

  if (currentGroup.length > 0) {
    blocks.push(createBlockFromCluster(currentGroup, defaultZoomLevel, preLeadTime, postHoldTime, mousePoints, easeType));
  }

  return blocks;
}

function createBlockFromCluster(
  group: ClickEvent[],
  zoomLevel: number,
  preLead: number,
  postHold: number,
  mousePoints?: MousePoint[],
  easeType: 'spring' | 'easeInOut' | 'linear' = 'spring'
): ZoomBlock {
  const firstT = group[0].t / 1000;
  const lastClick = group[group.length - 1];
  const lastT = lastClick.t / 1000;

  // Compute average center
  let sumX = 0;
  let sumY = 0;
  for (const c of group) {
    sumX += c.x;
    sumY += c.y;
  }
  const avgX = sumX / group.length;
  const avgY = sumY / group.length;

  const startTime = Math.max(0, firstT - preLead);
  let endTime = lastT + postHold;

  // Smart Mouse Escape Detection:
  // If mouse moved far away from the click position right after click, zoom out immediately!
  if (mousePoints && mousePoints.length > 0) {
    const lastClickMs = lastClick.t;
    const postPoints = mousePoints.filter((p) => p.t >= lastClickMs && p.t <= lastClickMs + 1200);

    for (const p of postPoints) {
      const dx = p.x - lastClick.x;
      const dy = p.y - lastClick.y;
      const dist = Math.hypot(dx, dy);

      // If mouse moved > 12% across the screen away from click
      if (dist > 0.12) {
        const escapeTime = p.t / 1000;
        // End zoom ~0.25s after the mouse starts fleeing
        endTime = Math.min(endTime, Math.max(firstT + 0.45, escapeTime + 0.25));
        break;
      }
    }
  }

  return {
    id: `zoom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    startTime: Number(startTime.toFixed(2)),
    endTime: Number(endTime.toFixed(2)),
    targetX: Number(avgX.toFixed(3)),
    targetY: Number(avgY.toFixed(3)),
    zoomLevel,
    easeType,
    isAuto: true,
    label: group.length > 1 ? `Cluster (${group.length} clicks)` : `Click Zoom (${(avgX * 100).toFixed(0)}%, ${(avgY * 100).toFixed(0)}%)`,
  };
}
