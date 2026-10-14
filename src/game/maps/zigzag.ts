import type { MapDef, Mover, Shape, Zone } from './types';
import { bumperField, funnel, pinField, rotor, slider, slope } from './helpers';

const W = 22;
const RUN = W - 4;
const DROP = 6.5;
const statics: Shape[] = [];
const movers: Mover[] = [];

for (let i = 0; i < 6; i++) {
  const y0 = 6 + i * 8.5;
  const ltr = i % 2 === 0;
  statics.push(ltr ? slope(0, y0, RUN, y0 + DROP) : slope(W, y0, W - RUN, y0 + DROP));
  movers.push(rotor(W / 2, y0 + DROP / 2 - 3, 3.6, ltr ? 2 : -2));
  movers.push(rotor(ltr ? W - 2 : 2, y0 + DROP + 0.5, 2, ltr ? -3 : 3));
}

statics.push(...funnel(W, 58, 68, 3.6));
statics.push(...pinField(0, W, 71, 81, 1.7, 2.4));

for (const x of [5.5, 11, 16.5]) {
  statics.push({ kind: 'box', x, y: 90, w: 0.4, h: 10 });
}
[2.75, 8.25, 13.75, 19.25].forEach((x, i) => movers.push(rotor(x, 83, 4.6, i % 2 === 0 ? 2.2 : -2.2)));
statics.push(...bumperField(0, W, 98, 106, 4, 5.5, 0.7));
movers.push(slider(5.5, 110, 4.4, 2.8, 1.2, 0), slider(16.5, 110, 4.4, 2.8, -1.2, 1));

statics.push(...funnel(W, 113, 123, 3.2));
statics.push(...pinField(0, W, 125, 129, 1.8, 2.8));
movers.push(rotor(11, 118, 4, 2.4));

const zones: Zone[] = [
  { kind: 'wind', x: 11, y: 30, w: 22, h: 14, ax: 3, period: 5 },
  { kind: 'wind', x: 11, y: 70, w: 5, h: 3, ay: 10 },
  { kind: 'slow', x: 11, y: 96, w: 14, h: 3, damping: 3 },
  {
    kind: 'portal',
    x: 20.5,
    y: 103,
    w: 3,
    h: 2,
    targets: [{ x: 5.5, y: 80 }, { x: 11, y: 80 }],
  },
];

export const zigzag: MapDef = {
  id: 'zigzag',
  name: '지그재그',
  description: '믹서 경사판, 돌풍, 4갈래 레인, 끈적 구역, 범퍼, 포털',
  accent: '#a78bfa',
  width: W,
  height: 133,
  spawn: { x: 1, y: 1, w: 20, h: 4 },
  finishY: 131,
  statics,
  movers,
  zones,
  restitution: 0.35,
  friction: 0.05,
};
