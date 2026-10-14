import { describe, it, expect } from 'vitest';
import { Simulation } from './engine';
import { MAPS } from './maps';
import { colorsFor } from './marble';

const HARD_CAP_SEC = 900;
const MIN_RACE_SEC = 45;

function names(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `m${i % 17}`);
}

function runAll(sim: Simulation, limitSec: number): void {
  while (!sim.done && sim.time < limitSec) sim.step();
}

describe('Simulation', () => {
  for (const map of MAPS) {
    for (const n of [1, 10, 100, 200]) {
      it(`${map.id} / ${n}개: 타임아웃 없이 전원 도착`, () => {
        const sim = new Simulation(map, names(n), 42);
        runAll(sim, HARD_CAP_SEC);
        expect(sim.done).toBe(true);
        expect(sim.arrivals.length).toBe(n);
        expect(new Set(sim.arrivals).size).toBe(n);
        console.log(`${map.id} ${n}: ${sim.time.toFixed(1)}s`);
      }, 300000);
    }

    it(`${map.id}: 구슬 10개 경주가 ${MIN_RACE_SEC}초 이상 걸린다(박진감)`, () => {
      const sim = new Simulation(map, names(10), 7);
      runAll(sim, HARD_CAP_SEC);
      expect(sim.time).toBeGreaterThanOrEqual(MIN_RACE_SEC);
    }, 300000);

    it(`${map.id}: 장애물이 충분히 많다`, () => {
      expect(map.statics.length + map.movers.length * 4 + map.zones.length * 6).toBeGreaterThanOrEqual(200);
    });
  }

  it('같은 시드는 같은 도착 순서', () => {
    const a = new Simulation(MAPS[0], names(30), 7);
    const b = new Simulation(MAPS[0], names(30), 7);
    runAll(a, HARD_CAP_SEC);
    runAll(b, HARD_CAP_SEC);
    expect(a.arrivals).toEqual(b.arrivals);
  }, 300000);

  it('다른 시드는 다른 결과를 낼 수 있다', () => {
    const a = new Simulation(MAPS[0], names(30), 1);
    const b = new Simulation(MAPS[0], names(30), 2);
    runAll(a, HARD_CAP_SEC);
    runAll(b, HARD_CAP_SEC);
    expect(a.arrivals).not.toEqual(b.arrivals);
  }, 300000);

  it('도착한 구슬은 arrived=true와 순위를 가진다', () => {
    const sim = new Simulation(MAPS[1], names(5), 3);
    runAll(sim, HARD_CAP_SEC);
    sim.marbles.forEach((m) => expect(m.arrived).toBe(true));
    expect(sim.marbles.map((m) => m.rank).sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4]);
  }, 300000);
});

describe('Simulation 안정성', () => {
  it('벽 밖으로 빠진 구슬이 없다(슬라이더 맵)', () => {
    for (const map of [MAPS[0], MAPS[1], MAPS[3]]) {
      const sim = new Simulation(map, names(100), 42);
      let outside = 0;
      while (!sim.done && sim.time < HARD_CAP_SEC) {
        sim.step();
        for (const m of sim.marbles) {
          if (!m.arrived && (m.x < -0.05 || m.x > map.width + 0.05)) outside++;
        }
      }
      expect(outside, map.id).toBe(0);
    }
  }, 300000);

  it('여러 시드에서 모든 맵이 끝난다', () => {
    for (const map of MAPS) {
      for (const seed of [1, 2, 3, 4]) {
        const sim = new Simulation(map, names(40), seed);
        runAll(sim, HARD_CAP_SEC);
        expect(sim.done, `${map.id} seed ${seed}`).toBe(true);
      }
    }
  }, 600000);
});

describe('시작 순서 섞기', () => {
  const grouped = ['a', 'a', 'a', 'a', 'b', 'b', 'b', 'b', 'c', 'c', 'c', 'c'];

  it('시작 위치 순서가 입력 순서 그대로가 아니다(시드별로 섞인다)', () => {
    const orders = [1, 2, 3, 4, 5].map((seed) =>
      new Simulation(MAPS[0], grouped, seed).marbles.map((m) => m.name).join(''),
    );
    expect(orders.some((o) => o !== grouped.join(''))).toBe(true);
    expect(new Set(orders).size).toBeGreaterThan(1);
  });

  it('같은 시드는 같은 섞임이고, 구슬 구성은 보존된다', () => {
    const a = new Simulation(MAPS[0], grouped, 9).marbles.map((m) => m.name);
    const b = new Simulation(MAPS[0], grouped, 9).marbles.map((m) => m.name);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([...grouped].sort());
  });

  it('섞여도 색은 입력 순서 기준(참가자 칩 색)과 같다', () => {
    const sim = new Simulation(MAPS[0], grouped, 3);
    const colorOf = (name: string) => sim.marbles.find((m) => m.name === name)!.color;
    expect(colorsFor(grouped)[0]).toBe(colorOf('a'));
    expect(colorsFor(grouped)[4]).toBe(colorOf('b'));
    expect(colorsFor(grouped)[8]).toBe(colorOf('c'));
    sim.marbles.forEach((m, i) => expect(m.id).toBe(i));
  });
});
