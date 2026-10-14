import type { MapDef, Mover, Shape, Zone } from './types';
import { bumperField, funnel, pinField, rotor, slider } from './helpers';

const W = 22;
const statics: Shape[] = [
  ...funnel(W, 8, 20, 5),
  ...pinField(0, W, 23, 32, 1.8, 2.2),
  ...funnel(W, 35, 47, 4.2),
  ...bumperField(0, W, 51, 63, 4, 5, 0.7),
  ...pinField(0, W, 53, 65, 4, 2.5),
  ...funnel(W, 67, 79, 3.6),
  ...funnel(W, 90, 102, 3.2),
  ...pinField(0, W, 105, 112, 1.8, 2.4),
  ...pinField(0, W, 121, 121, 1, 3.2),
];
const movers: Mover[] = [
  rotor(11, 41, 5, 2),
  rotor(11, 73, 4.5, -2.2),
  slider(5.5, 84, 4.4, 2.8, 1, 0),
  slider(16.5, 84, 4.4, 2.8, -1, 2),
  rotor(11, 96, 4, 2.4),
  rotor(3.5, 117, 4, 2.2),
  rotor(9.5, 117, 4, -2.2),
  rotor(15.5, 117, 4, 2.2),
];

const zones: Zone[] = [
  { kind: 'wind', x: 11, y: 49, w: 6, h: 3, ay: 9 },
  { kind: 'slow', x: 11, y: 81, w: 6, h: 3, damping: 4 },
  { kind: 'wind', x: 11, y: 108, w: 22, h: 8, ax: 3, period: 6 },
  {
    kind: 'portal',
    x: 20,
    y: 110,
    w: 3,
    h: 2,
    targets: [{ x: 5, y: 87 }, { x: 11, y: 87 }, { x: 17, y: 87 }],
  },
];

export const funnelMap: MapDef = {
  id: 'funnel',
  name: '깔때기',
  description: '좁아지는 깔때기 4단, 가속·끈적 구역, 돌풍, 포털',
  accent: '#34d399',
  width: W,
  height: 126,
  spawn: { x: 1, y: 1, w: 20, h: 4 },
  finishY: 124,
  statics,
  movers,
  zones,
  restitution: 0.35,
  friction: 0.08,
};
