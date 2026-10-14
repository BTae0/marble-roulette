import type { MapDef } from './types';
import { pinball } from './pinball';
import { zigzag } from './zigzag';
import { windmill } from './windmill';
import { funnelMap } from './funnel';

export const MAPS: MapDef[] = [pinball, zigzag, windmill, funnelMap];

export function getMap(id: string): MapDef {
  return MAPS.find((m) => m.id === id) ?? MAPS[0];
}

export type { MapDef, Shape, Mover, Zone } from './types';
