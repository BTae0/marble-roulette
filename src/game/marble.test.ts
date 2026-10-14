import { describe, it, expect } from 'vitest';
import { spawnPositions, MARBLE_R } from './marble';

const zone = { x: 1, y: 1, w: 18, h: 4 };

describe('spawnPositions', () => {
  for (const n of [1, 3, 9, 36, 100, 200]) {
    it(`${n}개: 구역 안에 겹치지 않고 배치된다`, () => {
      const p = spawnPositions(n, zone, () => 0.5);
      expect(p.length).toBe(n);
      for (const q of p) {
        expect(q.x).toBeGreaterThanOrEqual(zone.x);
        expect(q.x).toBeLessThanOrEqual(zone.x + zone.w);
        expect(q.y).toBeGreaterThanOrEqual(zone.y);
        expect(q.y).toBeLessThanOrEqual(zone.y + zone.h);
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          expect(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y)).toBeGreaterThanOrEqual(MARBLE_R * 2);
        }
      }
    });
  }
});
