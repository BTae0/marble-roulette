import { describe, it, expect } from 'vitest';
import { addEntries, addNumbered, expand, removeEntry, sanitize, setCount, shuffleEntries, total, type Entry } from './roster';
import { MAX_MARBLES, mulberry32 } from './names';

const e = (name: string, count = 1): Entry => ({ name, count });

describe('addEntries', () => {
  it('이름 하나를 추가한다', () => {
    expect(addEntries([], '수박').entries).toEqual([e('수박')]);
  });
  it('쉼표/줄바꿈/탭으로 여러 명을 추가한다', () => {
    expect(addEntries([], 'a,b\nc\td').entries.map((x) => x.name)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('이름*N은 개수로 해석한다', () => {
    expect(addEntries([], '수박*3').entries).toEqual([e('수박', 3)]);
  });
  it('같은 이름은 합쳐서 개수를 늘린다', () => {
    expect(addEntries([e('수박', 2)], '수박,수박*2').entries).toEqual([e('수박', 5)]);
  });
  it('공백만 있으면 변화가 없고 경고도 없다', () => {
    const r = addEntries([e('a')], '  , \n ');
    expect(r.entries).toEqual([e('a')]);
    expect(r.warnings).toEqual([]);
  });
  it('잘못된 개수는 무시하고 경고한다', () => {
    for (const bad of ['a*0', 'a*-1', 'a*abc', '*3', 'a*1.5']) {
      const r = addEntries([], bad);
      expect(r.entries, bad).toEqual([]);
      expect(r.warnings.length, bad).toBe(1);
    }
  });
  it('총 개수 상한을 넘기면 잘라내고 경고한다', () => {
    const r = addEntries([e('a', 199)], 'b*5');
    expect(total(r.entries)).toBe(MAX_MARBLES);
    expect(r.warnings.length).toBe(1);
  });
  it('아주 큰 개수도 즉시 처리한다', () => {
    const t0 = performance.now();
    const r = addEntries([], 'a*30000000');
    expect(total(r.entries)).toBe(MAX_MARBLES);
    expect(performance.now() - t0).toBeLessThan(100);
  });
  it('이미 가득 차 있으면 추가하지 않고 경고한다', () => {
    const r = addEntries([e('a', MAX_MARBLES)], 'b');
    expect(r.entries).toEqual([e('a', MAX_MARBLES)]);
    expect(r.warnings.length).toBe(1);
  });
  it('원본 배열을 바꾸지 않는다', () => {
    const src = [e('a')];
    addEntries(src, 'b');
    expect(src).toEqual([e('a')]);
  });
});

describe('setCount / removeEntry', () => {
  it('개수를 바꾼다', () => {
    expect(setCount([e('a'), e('b')], 1, 4)).toEqual([e('a'), e('b', 4)]);
  });
  it('0 이하이면 삭제한다', () => {
    expect(setCount([e('a'), e('b')], 0, 0)).toEqual([e('b')]);
  });
  it('상한을 넘기지 않는다', () => {
    const r = setCount([e('a', 150), e('b', 40)], 1, 100);
    expect(total(r)).toBe(MAX_MARBLES);
  });
  it('범위 밖 인덱스는 무시한다', () => {
    expect(setCount([e('a')], 5, 3)).toEqual([e('a')]);
  });
  it('removeEntry', () => {
    expect(removeEntry([e('a'), e('b')], 0)).toEqual([e('b')]);
  });
});

describe('expand / total / shuffleEntries', () => {
  it('펼치면 이름이 개수만큼 나온다', () => {
    expect(expand([e('a', 2), e('b')])).toEqual(['a', 'a', 'b']);
    expect(total([e('a', 2), e('b')])).toBe(3);
  });
  it('섞어도 내용은 같고 같은 시드는 같은 결과', () => {
    const src = [e('a'), e('b'), e('c'), e('d')];
    const x = shuffleEntries(src, mulberry32(3));
    expect(x.map((v) => v.name).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(shuffleEntries(src, mulberry32(3))).toEqual(x);
  });
});

describe('addNumbered', () => {
  it('1번~N번을 추가한다', () => {
    expect(addNumbered([], 3).entries.map((x) => x.name)).toEqual(['1번', '2번', '3번']);
  });
  it('이미 있는 번호는 건너뛴다', () => {
    expect(addNumbered([e('2번')], 3).entries.map((x) => x.name)).toEqual(['2번', '1번', '3번']);
  });
  it('상한을 넘기지 않는다', () => {
    expect(total(addNumbered([], 9999).entries)).toBe(MAX_MARBLES);
  });
});

describe('sanitize', () => {
  it('올바른 값은 통과한다', () => {
    expect(sanitize([{ name: '수박', count: 2 }])).toEqual([e('수박', 2)]);
  });
  it('손상된 값은 null', () => {
    for (const bad of [null, 'x', 3, {}, [{ name: 1, count: 1 }], [{ name: 'a', count: 'x' }], [{ name: ' ', count: 1 }]]) {
      expect(sanitize(bad), JSON.stringify(bad)).toBeNull();
    }
  });
  it('개수는 1 이상 정수로, 총합은 상한으로 보정한다', () => {
    const r = sanitize([{ name: 'a', count: 0 }, { name: 'b', count: 1.7 }, { name: 'c', count: 9999 }]);
    expect(r).not.toBeNull();
    expect(r!.every((x) => Number.isInteger(x.count) && x.count >= 1)).toBe(true);
    expect(total(r!)).toBeLessThanOrEqual(MAX_MARBLES);
  });
});
