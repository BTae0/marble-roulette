import { describe, it, expect } from 'vitest';
import { Simulation } from './engine';
import type { MapDef } from './maps';
import type { Zone } from './maps/types';

function miniMap(zones: Zone[]): MapDef {
  return {
    id: 'mini',
    name: 'mini',
    description: '',
    accent: '#fff',
    width: 22,
    height: 62,
    spawn: { x: 10, y: 1, w: 2, h: 2 },
    finishY: 60,
    statics: [],
    movers: [],
    zones,
    restitution: 0.3,
    friction: 0.1,
  };
}

function run(map: MapDef, sec: number): Simulation {
  const sim = new Simulation(map, ['a'], 1);
  while (!sim.done && sim.time < sec) sim.step();
  return sim;
}

describe('환경 구역', () => {
  it('바람 구역은 구슬을 옆으로 민다', () => {
    const calm = run(miniMap([]), 2.5);
    const windy = run(miniMap([{ kind: 'wind', x: 11, y: 10, w: 22, h: 20, ax: 20 }]), 2.5);
    expect(windy.marbles[0].x - calm.marbles[0].x).toBeGreaterThan(1);
  });

  it('주기가 있는 바람은 방향이 바뀐다', () => {
    const zone: Zone = { kind: 'wind', x: 11, y: 30, w: 22, h: 60, ax: 8, period: 4 };
    const sim = new Simulation(miniMap([zone]), ['a'], 1);
    const xs: number[] = [];
    while (sim.time < 8) {
      sim.step();
      xs.push(sim.marbles[0].x);
    }
    const peak = Math.max(...xs);
    expect(xs[xs.length - 1]).toBeLessThan(peak - 0.2);
  });

  it('끈적 구역은 낙하를 늦춘다', () => {
    const free = run(miniMap([]), 3);
    const slow = run(miniMap([{ kind: 'slow', x: 11, y: 20, w: 22, h: 40, damping: 4 }]), 3);
    expect(slow.marbles[0].y).toBeLessThan(free.marbles[0].y - 2);
  });

  it('포털 구역은 구슬을 도착점으로 보낸다', () => {
    const zone: Zone = { kind: 'portal', x: 11, y: 20, w: 22, h: 2, targets: [{ x: 5, y: 6 }] };
    const sim = new Simulation(miniMap([zone]), ['a'], 1);
    let teleported = false;
    let prevY = sim.marbles[0].y;
    while (sim.time < 8 && !teleported) {
      sim.step();
      const y = sim.marbles[0].y;
      if (prevY - y > 5) teleported = true;
      prevY = y;
    }
    expect(teleported).toBe(true);
    expect(sim.marbles[0].x).toBeLessThan(8);
  });
});
