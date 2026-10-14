export type Shape =
  | { kind: 'circle'; x: number; y: number; r: number; bounce?: number }
  | { kind: 'box'; x: number; y: number; w: number; h: number; angle?: number };

export type Mover =
  | { kind: 'rotor'; x: number; y: number; length: number; thickness: number; speed: number }
  | { kind: 'slider'; x: number; y: number; w: number; h: number; range: number; speed: number; phase?: number };

interface ZoneBase {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Zone =
  | (ZoneBase & { kind: 'wind'; ax?: number; ay?: number; period?: number })
  | (ZoneBase & { kind: 'slow'; damping: number })
  | (ZoneBase & { kind: 'portal'; targets: { x: number; y: number }[] });

export interface MapDef {
  id: string;
  name: string;
  description: string;
  accent: string;
  width: number;
  height: number;
  spawn: { x: number; y: number; w: number; h: number };
  finishY: number;
  statics: Shape[];
  movers: Mover[];
  zones: Zone[];
  restitution: number;
  friction: number;
}
