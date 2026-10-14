import type { MapDef, Mover, Shape, Zone } from './types';
import { funnel, pinField, rotor } from './helpers';

const W = 26;
const statics: Shape[] = [];
const movers: Mover[] = [];

function rotorRow(ri: number, y: number): void {
  const even = ri % 2 === 0;
  const xs = even ? [4.5, 13, 21.5] : [8.75, 17.25];
  const len = even ? 7 : 6;
  xs.forEach((x, i) => {
    const dir = (ri + i) % 2 === 0 ? 1 : -1;
    movers.push(rotor(x, y, len, dir * (1.4 + 0.3 * (ri % 3))));
  });
  statics.push(...pinField(0, W, y + 5, y + 5, 1, 3.4));
}

for (let ri = 0; ri < 6; ri++) rotorRow(ri, 10 + ri * 10);
statics.push(...funnel(W, 68, 78, 4));
for (let ri = 6; ri < 8; ri++) rotorRow(ri, 84 + (ri - 6) * 10);
statics.push(...funnel(W, 103, 113, 3.6));
movers.push(rotor(13, 108, 4, 2.4));
statics.push(...pinField(0, W, 116, 122, 1.8, 2.8));

const zones: Zone[] = [
  { kind: 'wind', x: 13, y: 35, w: 26, h: 14, ax: 3, period: 6 },
  { kind: 'slow', x: 13, y: 80, w: 6, h: 3, damping: 4 },
  { kind: 'wind', x: 13, y: 99, w: 12, h: 3, ay: 8 },
  {
    kind: 'portal',
    x: 1.5,
    y: 100,
    w: 3,
    h: 2,
    targets: [{ x: 20, y: 82 }, { x: 6, y: 82 }],
  },
];

export const windmill: MapDef = {
  id: 'windmill',
  name: '회전 풍차',
  description: '엇갈려 도는 풍차 8단, 돌풍, 끈적 구역, 가속 구역, 포털',
  accent: '#fb923c',
  width: W,
  height: 126,
  spawn: { x: 1, y: 1, w: 24, h: 4 },
  finishY: 124,
  statics,
  movers,
  zones,
  restitution: 0.5,
  friction: 0.05,
};
