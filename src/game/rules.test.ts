import { describe, it, expect } from 'vitest';
import { clampK, pickWinners } from './rules';

describe('clampK', () => {
  it('범위로 보정한다', () => {
    expect(clampK(0, 5)).toBe(1);
    expect(clampK(99, 5)).toBe(5);
    expect(clampK(3, 5)).toBe(3);
    expect(clampK(NaN, 5)).toBe(1);
    expect(clampK(2.7, 5)).toBe(2);
  });
  it('구슬이 없어도 1 이상', () => {
    expect(clampK(3, 0)).toBe(1);
  });
});

describe('pickWinners', () => {
  const order = [4, 2, 9, 7];
  it('first', () => expect(pickWinners('first', order, 1)).toEqual([4]));
  it('last', () => expect(pickWinners('last', order, 1)).toEqual([7]));
  it('multiple', () => expect(pickWinners('multiple', order, 2)).toEqual([4, 2]));
  it('multiple K 초과는 보정', () => expect(pickWinners('multiple', order, 9)).toEqual(order));
  it('빈 순위는 빈 결과', () => expect(pickWinners('last', [], 1)).toEqual([]));
});
