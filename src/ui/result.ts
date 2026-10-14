import type { MarbleState } from '../game/marble';
import type { Mode } from '../game/rules';

const MODE_LABEL: Record<Mode, string> = {
  first: '1등 당첨',
  last: '꼴찌 당첨',
  multiple: '상위 당첨',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function swatch(color: string): HTMLSpanElement {
  const s = el('span', 'sw');
  s.style.background = color;
  return s;
}

export function resultText(mode: Mode, winners: MarbleState[], ranking: MarbleState[]): string {
  const head = `[${MODE_LABEL[mode]}] ${winners.map((w) => w.name).join(', ')}`;
  const arrived = ranking.filter((m) => m.arrived).map((m, i) => `${i + 1}위 ${m.name}`);
  return [head, ...arrived].join('\n');
}

export function renderResult(mode: Mode, winners: MarbleState[], ranking: MarbleState[]): void {
  document.getElementById('resultKicker')!.textContent = MODE_LABEL[mode];
  const winnersEl = document.getElementById('winners')!;
  winnersEl.replaceChildren(
    ...winners.map((w) => {
      const card = el('div', 'winner');
      card.append(swatch(w.color), el('span', undefined, w.name));
      if (w.rank >= 0) card.append(el('small', undefined, `${w.rank + 1}위 도착`));
      return card;
    }),
  );
  const winIds = new Set(winners.map((w) => w.id));
  document.getElementById('ranking')!.replaceChildren(
    ...ranking.map((m, i) => {
      const li = el('li', winIds.has(m.id) ? 'win' : undefined);
      li.append(el('span', 'no', String(i + 1)), swatch(m.color), el('span', undefined, m.name));
      if (!m.arrived) li.append(el('span', 'tag', '미도착'));
      return li;
    }),
  );
}

export function runConfetti(canvas: HTMLCanvasElement): () => void {
  let reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    reduced = false;
  }
  const ctx = canvas.getContext('2d');
  if (reduced || !ctx) return () => undefined;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = (canvas.width = Math.round(canvas.clientWidth * dpr));
  const h = (canvas.height = Math.round(canvas.clientHeight * dpr));
  const colors = ['#38bdf8', '#a78bfa', '#fb7185', '#fbbf24', '#34d399'];
  const parts = Array.from({ length: 110 }, () => ({
    x: Math.random() * w,
    y: -Math.random() * h * 0.6,
    vx: (Math.random() - 0.5) * 3 * dpr,
    vy: (2 + Math.random() * 4) * dpr,
    s: (4 + Math.random() * 6) * dpr,
    c: colors[Math.floor(Math.random() * colors.length)],
    r: Math.random() * 6,
  }));
  let raf = 0;
  let stopped = false;
  const tick = (): void => {
    if (stopped) return;
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.r += 0.1;
      if (p.y < h + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, w, h);
  };
}
