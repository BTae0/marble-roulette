import { MAX_MARBLES, shuffle } from './names';

export interface Entry {
  name: string;
  count: number;
}

export interface AddResult {
  entries: Entry[];
  warnings: string[];
}

const MAX_NAME_LEN = 30;
const FULL_WARNING = `구슬은 최대 ${MAX_MARBLES}개까지만 사용합니다.`;

export function total(entries: Entry[]): number {
  return entries.reduce((sum, e) => sum + e.count, 0);
}

export function expand(entries: Entry[]): string[] {
  return entries.flatMap((e) => Array.from({ length: e.count }, () => e.name));
}

function merge(entries: Entry[], name: string, count: number): Entry[] {
  const i = entries.findIndex((e) => e.name === name);
  if (i < 0) return [...entries, { name, count }];
  return entries.map((e, idx) => (idx === i ? { name, count: e.count + count } : e));
}

export function addEntries(entries: Entry[], input: string): AddResult {
  let next = entries;
  const warnings: string[] = [];
  let full = false;
  for (const raw of input.split(/[,\n\t]/)) {
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
    name = name.slice(0, MAX_NAME_LEN);
    const take = Math.min(count, MAX_MARBLES - total(next));
    if (take < count) full = true;
    if (take > 0) next = merge(next, name, take);
  }
  if (full) warnings.push(FULL_WARNING);
  return { entries: next, warnings };
}

export function setCount(entries: Entry[], index: number, count: number): Entry[] {
  if (index < 0 || index >= entries.length) return entries;
  const n = Math.floor(count);
  if (!(n >= 1)) return removeEntry(entries, index);
  const allowed = MAX_MARBLES - (total(entries) - entries[index].count);
  const clamped = Math.min(n, allowed);
  return entries.map((e, i) => (i === index ? { ...e, count: clamped } : e));
}

export function removeEntry(entries: Entry[], index: number): Entry[] {
  return entries.filter((_, i) => i !== index);
}

export function shuffleEntries(entries: Entry[], rand: () => number): Entry[] {
  return shuffle(entries, rand);
}

export function addNumbered(entries: Entry[], n: number): AddResult {
  let next = entries;
  let full = false;
  const last = Math.min(Math.max(1, Math.floor(n)), MAX_MARBLES);
  for (let k = 1; k <= last; k++) {
    const name = `${k}번`;
    if (next.some((e) => e.name === name)) continue;
    if (total(next) >= MAX_MARBLES) {
      full = true;
      break;
    }
    next = [...next, { name, count: 1 }];
  }
  return { entries: next, warnings: full ? [FULL_WARNING] : [] };
}

export function sanitize(raw: unknown): Entry[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Entry[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null;
    const { name, count } = item as { name?: unknown; count?: unknown };
    if (typeof name !== 'string' || !name.trim() || typeof count !== 'number' || !Number.isFinite(count)) return null;
    const n = Math.floor(count);
    if (n < 1) continue;
    const take = Math.min(n, MAX_MARBLES - total(out));
    if (take > 0) out.push({ name: name.trim().slice(0, MAX_NAME_LEN), count: take });
  }
  return out;
}
