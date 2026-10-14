export type Mode = 'first' | 'last' | 'multiple';

export function clampK(k: number, count: number): number {
  const max = Math.max(1, count);
  if (!Number.isFinite(k)) return 1;
  return Math.min(max, Math.max(1, Math.floor(k)));
}

export function pickWinners(mode: Mode, order: number[], k: number): number[] {
  if (order.length === 0) return [];
  if (mode === 'first') return [order[0]];
  if (mode === 'last') return [order[order.length - 1]];
  return order.slice(0, clampK(k, order.length));
}
