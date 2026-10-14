import type { MapDef, Mover, Shape, Zone } from './types';
import { bumperField, funnel, pinField, rotor, slider } from './helpers';

const W = 22;
const statics: Shape[] = [
  ...pinField(0, W, 8, 30, 1.8, 2),
  ...funnel(W, 33, 45, 4),
  ...bumperField(0, W, 50, 66, 4.4, 5),
  ...pinField(0, W, 52.2, 68.2, 4.4, 2.5),
  ...funnel(W, 112, 122, 3.4),
  ...pinField(0, W, 124, 129, 1.6, 2.6),
];
const movers: Mover[] = [
  rotor(11, 38.5, 5, 2),
  slider(5.5, 82, 4.4, 2.8, 1.1, 0),
  slider(16.5, 82, 4.4, 2.8, -1.1, 1),
  slider(5.5, 88, 4.4, 2.8, 0.9, 2),
  slider(16.5, 88, 4.4, 2.8, -0.9, 3),
  rotor(11, 117, 4.6, -2.2),
];

[96, 104].forEach((y, ri) => {
  const xs = ri % 2 === 0 ? [3.5, 9.5, 15.5] : [6.5, 12.5, 18.5];
  xs.forEach((x, i) => movers.push(rotor(x, y, 4, (ri + i) % 2 === 0 ? 2.2 : -2.2)));
  statics.push(...pinField(0, W, y + 4, y + 4, 1, 3.2));
});

const zones: Zone[] = [
  { kind: 'wind', x: 11, y: 74, w: 22, h: 8, ax: 3.5, period: 7 },
  { kind: 'wind', x: 11, y: 48, w: 8, h: 3, ay: 9 },
  { kind: 'slow', x: 11, y: 92, w: 12, h: 4, damping: 3 },
  {
    kind: 'portal',
    x: 1.6,
    y: 101,
    w: 2.8,
    h: 2,
    targets: [{ x: 6, y: 78 }, { x: 11, y: 78 }, { x: 16, y: 78 }],
  },
];

export const pinball: MapDef = {
  id: 'pinball',
  name: '핀볼',
  description: '핀 숲, 범퍼, 돌풍, 슬라이딩 문, 끈적 구역, 회전 격자, 포털',
  accent: '#38bdf8',
  width: W,
  height: 133,
  spawn: { x: 1, y: 1, w: 20, h: 4 },
  finishY: 131,
  statics,
  movers,
  zones,
  restitution: 0.45,
  friction: 0.1,
};
