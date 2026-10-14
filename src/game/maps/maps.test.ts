import { describe, it, expect } from 'vitest';
import { MAPS } from './index';

describe('맵 데이터 검증', () => {
  for (const map of MAPS) {
    it(`${map.id}: 슬라이더가 이동 범위 끝에서도 벽과 구슬 지름 이상 떨어져 있다`, () => {
      for (const m of map.movers) {
        if (m.kind !== 'slider') continue;
        expect(m.x - m.range - m.w / 2).toBeGreaterThanOrEqual(0.45);
        expect(m.x + m.range + m.w / 2).toBeLessThanOrEqual(map.width - 0.45);
      }
    });
    it(`${map.id}: 길이가 100~140 m 범위다(너무 길지 않다)`, () => {
      expect(map.height).toBeGreaterThanOrEqual(100);
      expect(map.height).toBeLessThanOrEqual(140);
    });
    it(`${map.id}: 변수 환경(구역)이 3개 이상이고 종류가 2가지 이상이다`, () => {
      expect(map.zones.length).toBeGreaterThanOrEqual(3);
      expect(new Set(map.zones.map((z) => z.kind)).size).toBeGreaterThanOrEqual(2);
    });
    it(`${map.id}: 구역과 포털 도착점이 맵 안에 있다`, () => {
      for (const z of map.zones) {
        expect(z.x - z.w / 2).toBeGreaterThanOrEqual(0);
        expect(z.x + z.w / 2).toBeLessThanOrEqual(map.width);
        expect(z.y).toBeLessThan(map.finishY);
        if (z.kind === 'portal') {
          expect(z.targets.length).toBeGreaterThan(0);
          for (const p of z.targets) {
            expect(p.x).toBeGreaterThan(0.5);
            expect(p.x).toBeLessThan(map.width - 0.5);
            expect(p.y).toBeLessThan(z.y);
          }
        }
      }
    });
    it(`${map.id}: 결승선과 시작 구역이 맵 안에 있다`, () => {
      expect(map.finishY).toBeLessThan(map.height);
      expect(map.spawn.x).toBeGreaterThanOrEqual(0);
      expect(map.spawn.x + map.spawn.w).toBeLessThanOrEqual(map.width);
    });
  }
});
