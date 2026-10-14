export const MAX_MARBLES = 200;

export interface ParseResult {
  names: string[];
  warnings: string[];
}

export function parseNames(input: string): ParseResult {
  const names: string[] = [];
  const warnings: string[] = [];
  let overflow = false;
  for (const raw of input.split(/[,\n]/)) {
    const token = raw.trim();
    if (!token) continue;
    const star = token.lastIndexOf('*');
    let name = token;
    let count = 1;
    if (star >= 0) {
      name = token.slice(0, star).trim();
      const num = token.slice(star + 1).trim();
      count = /^\d+$/.test(num) ? Number(num) : NaN;
    }
    if (!name || !Number.isInteger(count) || count < 1) {
      warnings.push(`"${token}" 항목을 무시했습니다.`);
      continue;
    }
    const take = Math.min(count, MAX_MARBLES - names.length);
    for (let i = 0; i < take; i++) names.push(name);
    if (take < count) overflow = true;
  }
  if (overflow) warnings.push(`구슬은 최대 ${MAX_MARBLES}개까지만 사용합니다.`);
  return { names, warnings };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
