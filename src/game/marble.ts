import type { Body } from 'planck';

export const MARBLE_R = 0.22;
export const STUCK_SEC = 2;
export const STUCK_DIST = 0.005;
export const STALL_SEC = 15;
export const MAX_NUDGE_POWER = 12;
const MAX_SPREAD = 1.6;

export interface MarbleState {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  arrived: boolean;
  rank: number;
}

export interface MarbleRuntime {
  state: MarbleState;
  body: Body;
  anchorX: number;
  anchorY: number;
  stillTime: number;
  stuckCount: number;
  bestY: number;
  bestAt: number;
  lastPortal: number;
}

export function colorsFor(names: string[]): string[] {
  const hue = new Map<string, number>();
  return names.map((n) => {
    if (!hue.has(n)) hue.set(n, (hue.size * 137.508) % 360);
    return `hsl(${hue.get(n)!.toFixed(1)} 85% 62%)`;
  });
}

export function spawnPositions(
  count: number,
  zone: { x: number; y: number; w: number; h: number },
  jitter: () => number,
): { x: number; y: number }[] {
  const rowStep = MARBLE_R * 2.3;
  const cols = Math.max(1, Math.floor(zone.w / rowStep));
  const colStep = count >= cols ? rowStep : Math.min(zone.w / count, MAX_SPREAD);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rowStart = (zone.w - Math.min(cols, count - row * cols) * colStep) / 2;
    out.push({
      x: zone.x + rowStart + (col + 0.5) * colStep + (jitter() - 0.5) * 0.04,
      y: zone.y + zone.h - (row + 0.5) * rowStep + (jitter() - 0.5) * 0.04,
    });
  }
  return out;
}
