import { describe, it, expect } from 'vitest';
import { parseNames, shuffle, mulberry32, MAX_MARBLES } from './names';

describe('parseNames', () => {
  it('쉼표와 줄바꿈으로 구분한다', () => {
    expect(parseNames('a,b\nc').names).toEqual(['a', 'b', 'c']);
  });
  it('*N을 확장한다', () => {
    expect(parseNames('수박*2,키위').names).toEqual(['수박', '수박', '키위']);
  });
  it('공백만 있으면 빈 결과', () => {
    expect(parseNames('  ,\n ').names).toEqual([]);
  });
  it('*0, 음수, 숫자 아님, 이름 없음은 무시하고 경고한다', () => {
    for (const bad of ['a*0', 'a*-1', 'a*abc', '*3']) {
      const r = parseNames(bad);
      expect(r.names).toEqual([]);
      expect(r.warnings.length).toBe(1);
    }
  });
  it('최대 개수로 잘라내고 경고한다', () => {
    const r = parseNames('a*9999');
    expect(r.names.length).toBe(MAX_MARBLES);
    expect(r.warnings.length).toBe(1);
  });
  it('아주 큰 개수도 즉시 상한으로 처리한다(메모리 보호)', () => {
    const t0 = performance.now();
    const r = parseNames('a*30000000,b*5');
    expect(r.names.length).toBe(MAX_MARBLES);
    expect(r.warnings.length).toBe(1);
    expect(performance.now() - t0).toBeLessThan(100);
  });
  it('소수 개수는 무시한다', () => {
    expect(parseNames('a*1.5').names).toEqual([]);
  });
});

describe('shuffle / mulberry32', () => {
  it('같은 시드는 같은 결과', () => {
    const a = shuffle([1, 2, 3, 4, 5], mulberry32(7));
    const b = shuffle([1, 2, 3, 4, 5], mulberry32(7));
    expect(a).toEqual(b);
  });
  it('원본을 바꾸지 않고 원소를 보존한다', () => {
    const src = [1, 2, 3, 4];
    const out = shuffle(src, mulberry32(1));
    expect(src).toEqual([1, 2, 3, 4]);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });
});
