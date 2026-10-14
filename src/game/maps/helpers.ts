import type { Mover, Shape } from './types';

export const PIN_R = 0.25;
export const MOVER_SPEED = 1.7;

function field(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  rowGap: number,
  colGap: number,
  make: (x: number, y: number) => Shape,
): Shape[] {
  const out: Shape[] = [];
  let row = 0;
  for (let y = y0; y <= y1 + 1e-6; y += rowGap, row++) {
    const offset = row % 2 === 0 ? colGap / 2 : colGap;
    for (let x = x0 + offset; x < x1 - 1e-6; x += colGap) out.push(make(x, y));
  }
  return out;
}

export function pinField(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  rowGap: number,
  colGap: number,
  r = PIN_R,
): Shape[] {
  return field(x0, x1, y0, y1, rowGap, colGap, (x, y) => ({ kind: 'circle', x, y, r }));
}

export function bumperField(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  rowGap: number,
  colGap: number,
  r = 0.8,
  bounce = 0.95,
): Shape[] {
  return field(x0, x1, y0, y1, rowGap, colGap, (x, y) => ({ kind: 'circle', x, y, r, bounce }));
}

export function slope(x1: number, y1: number, x2: number, y2: number, t = 0.3): Shape {
  return {
    kind: 'box',
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
    w: Math.hypot(x2 - x1, y2 - y1),
    h: t,
    angle: Math.atan2(y2 - y1, x2 - x1),
  };
}

export function funnel(width: number, yTop: number, yBottom: number, neck: number, cx = width / 2): Shape[] {
  return [slope(0, yTop, cx - neck / 2, yBottom), slope(width, yTop, cx + neck / 2, yBottom)];
}

export function rotor(x: number, y: number, length: number, speed: number, thickness = 0.4): Mover {
  return { kind: 'rotor', x, y, length, thickness, speed: speed * MOVER_SPEED };
}

export function slider(x: number, y: number, w: number, range: number, speed: number, phase = 0): Mover {
  return { kind: 'slider', x, y, w, h: 0.35, range, speed: speed * MOVER_SPEED, phase };
}
