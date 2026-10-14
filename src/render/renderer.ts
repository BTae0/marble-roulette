import type { Simulation } from '../game/engine';
import type { MapDef } from '../game/maps';
import { MARBLE_R } from '../game/marble';

export type Follow = 'leader' | 'last';

const VISIBLE_M = 22;
const TRAIL_LEN = 10;
const NO_CAMERA = -1000;

type Tx = (v: number) => number;

const ZONE_RGB = { wind: '56,189,248', slow: '148,163,184', portal: '167,139,250' } as const;
const ARROW_GAP_M = 2.4;

function drawZones(ctx: CanvasRenderingContext2D, sim: Simulation, scale: number, tx: Tx, ty: Tx): void {
  const time = sim.time;
  for (const z of sim.map.zones) {
    const rgb = ZONE_RGB[z.kind];
    const left = tx(z.x - z.w / 2);
    const top = ty(z.y - z.h / 2);
    ctx.fillStyle = `rgba(${rgb},0.12)`;
    ctx.fillRect(left, top, z.w * scale, z.h * scale);
    ctx.strokeStyle = `rgba(${rgb},0.55)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(left, top, z.w * scale, z.h * scale);
    ctx.setLineDash([]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, z.w * scale, z.h * scale);
    ctx.clip();
    ctx.fillStyle = `rgba(${rgb},0.55)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(12, scale * 1.1)}px system-ui, sans-serif`;
    if (z.kind === 'wind') {
      const w = sim.zoneWind(z);
      const horizontal = Math.abs(w.ax) >= Math.abs(w.ay);
      const dir = horizontal ? Math.sign(w.ax) : Math.sign(w.ay);
      if (dir !== 0 && Math.hypot(w.ax, w.ay) > 0.4) {
        const glyph = horizontal ? (dir > 0 ? '›' : '‹') : dir > 0 ? '⌄' : '⌃';
        const shift = (time * 3 * dir) % ARROW_GAP_M;
        for (let gx = z.x - z.w / 2 - ARROW_GAP_M; gx <= z.x + z.w / 2 + ARROW_GAP_M; gx += ARROW_GAP_M) {
          for (let gy = z.y - z.h / 2 - ARROW_GAP_M; gy <= z.y + z.h / 2 + ARROW_GAP_M; gy += ARROW_GAP_M) {
            ctx.fillText(glyph, tx(gx + (horizontal ? shift : 0)), ty(gy + (horizontal ? 0 : shift)));
          }
        }
      }
    } else if (z.kind === 'slow') {
      ctx.fillStyle = `rgba(${rgb},0.4)`;
      for (let gx = z.x - z.w / 2 + 0.6; gx < z.x + z.w / 2; gx += 1.2) {
        for (let gy = z.y - z.h / 2 + 0.6; gy < z.y + z.h / 2; gy += 1.2) {
          ctx.beginPath();
          ctx.arc(tx(gx), ty(gy), Math.max(1.5, scale * 0.12), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      const pulse = 0.6 + 0.4 * Math.sin(time * 4);
      ctx.fillStyle = `rgba(${rgb},${0.3 + 0.4 * pulse})`;
      ctx.fillText('◎', tx(z.x), ty(z.y));
    }
    ctx.restore();
    if (z.kind === 'portal') {
      ctx.strokeStyle = `rgba(${rgb},0.8)`;
      ctx.setLineDash([3, 4]);
      for (const p of z.targets) {
        ctx.beginPath();
        ctx.arc(tx(p.x), ty(p.y), Math.max(8, scale * 0.8), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }
}

function drawShapes(ctx: CanvasRenderingContext2D, map: MapDef, scale: number, tx: Tx, ty: Tx): void {
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  for (const s of map.statics) {
    if (s.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(tx(s.x), ty(s.y), s.r * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(tx(s.x), ty(s.y));
      ctx.rotate(s.angle ?? 0);
      ctx.beginPath();
      ctx.roundRect((-s.w / 2) * scale, (-s.h / 2) * scale, s.w * scale, s.h * scale, (s.h / 2) * scale);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawFinish(ctx: CanvasRenderingContext2D, map: MapDef, scale: number, tx: Tx, ty: Tx): void {
  const size = 0.5 * scale;
  const y = ty(map.finishY);
  const cols = Math.ceil((map.width * scale) / size);
  for (let i = 0; i < cols; i++) {
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = (i + r) % 2 === 0 ? '#f8fafc' : '#0f172a';
      ctx.fillRect(tx(0) + i * size, y + r * size, Math.min(size, map.width * scale - i * size), size);
    }
  }
}

export function drawMapThumb(canvas: HTMLCanvasElement, map: MapDef): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const scale = Math.min(w / (map.width + 1), h / (map.height + 1));
  const tx: Tx = (x) => (x - map.width / 2) * scale + w / 2;
  const ty: Tx = (y) => (y - map.height / 2) * scale + h / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(tx(0), ty(0), map.width * scale, map.height * scale);
  ctx.fillStyle = map.accent + '55';
  ctx.fillRect(tx(map.spawn.x), ty(map.spawn.y), map.spawn.w * scale, map.spawn.h * scale);
  for (const z of map.zones) {
    ctx.fillStyle = `rgba(${ZONE_RGB[z.kind]},0.35)`;
    ctx.fillRect(tx(z.x - z.w / 2), ty(z.y - z.h / 2), z.w * scale, Math.max(2, z.h * scale));
  }
  drawShapes(ctx, map, scale, tx, ty);
  ctx.fillStyle = map.accent;
  for (const m of map.movers) {
    const len = m.kind === 'rotor' ? m.length : m.w;
    ctx.fillRect(tx(m.x - len / 2), ty(m.y) - 1, len * scale, 2);
  }
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tx(0), ty(map.finishY), map.width * scale, 2);
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private camY = NO_CAMERA;
  private frame = 0;
  private trails = new Map<number, { x: number; y: number }[]>();
  private reduced = false;
  private lastScale = 20;
  auto = true;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D를 사용할 수 없습니다.');
    this.ctx = ctx;
    try {
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      this.reduced = false;
    }
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  panBy(dyPx: number): void {
    if (this.camY === NO_CAMERA) return;
    this.auto = false;
    this.camY += dyPx / this.lastScale;
  }

  reset(): void {
    this.camY = NO_CAMERA;
    this.auto = true;
    this.frame = 0;
    this.trails.clear();
  }

  draw(sim: Simulation, follow: Follow): void {
    const { ctx, w, h } = this;
    const map = sim.map;
    this.frame++;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const scale = Math.min(h / VISIBLE_M, w / (map.width + 1));
    const visibleH = h / scale;
    const lo = visibleH / 2 - 3;
    const hi = Math.max(lo, map.height + 3 - visibleH / 2);
    this.lastScale = scale;
    const target = Math.min(hi, Math.max(lo, this.focusY(sim, follow, map)));
    if (this.camY === NO_CAMERA) this.camY = target;
    else if (this.auto) this.camY += (target - this.camY) * 0.08;
    this.camY = Math.min(hi, Math.max(lo, this.camY));

    const tx: Tx = (x) => (x - map.width / 2) * scale + w / 2;
    const ty: Tx = (y) => (y - this.camY) * scale + h / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(tx(0), 0, map.width * scale, h);
    ctx.strokeStyle = map.accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = map.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(tx(0), 0);
    ctx.lineTo(tx(0), h);
    ctx.moveTo(tx(map.width), 0);
    ctx.lineTo(tx(map.width), h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    drawZones(ctx, sim, scale, tx, ty);
    drawShapes(ctx, map, scale, tx, ty);
    ctx.fillStyle = map.accent;
    const movers = sim.moverStates();
    map.movers.forEach((m, i) => {
      const st = movers[i];
      const len = m.kind === 'rotor' ? m.length : m.w;
      const thick = m.kind === 'rotor' ? m.thickness : m.h;
      ctx.save();
      ctx.translate(tx(st.x), ty(st.y));
      ctx.rotate(st.angle);
      ctx.beginPath();
      ctx.roundRect((-len / 2) * scale, (-thick / 2) * scale, len * scale, thick * scale, (thick / 2) * scale);
      ctx.fill();
      ctx.restore();
    });
    drawFinish(ctx, map, scale, tx, ty);

    this.drawMarbles(sim, scale, tx, ty);
    this.drawMinimap(sim, scale);
  }

  private focusY(sim: Simulation, follow: Follow, map: MapDef): number {
    const live = sim.marbles.filter((m) => !m.arrived);
    if (live.length === 0) return map.finishY;
    const ys = live.map((m) => m.y);
    return follow === 'leader' ? Math.max(...ys) - 2 : Math.min(...ys) + 2;
  }

  private drawMarbles(sim: Simulation, scale: number, tx: Tx, ty: Tx): void {
    const { ctx } = this;
    const total = sim.marbles.length;
    const showTrails = !this.reduced && total <= 80;
    const r = Math.max(3, MARBLE_R * scale);
    const live = sim.marbles.filter((m) => !m.arrived);
    const lead = new Set([...live].sort((a, b) => b.y - a.y).slice(0, 8).map((m) => m.id));
    for (const m of live) {
      const sx = tx(m.x);
      const sy = ty(m.y);
      if (sy < -40 || sy > this.h + 40) continue;
      if (showTrails) {
        let t = this.trails.get(m.id);
        if (!t) this.trails.set(m.id, (t = []));
        if (this.frame % 3 === 0) {
          t.push({ x: m.x, y: m.y });
          if (t.length > TRAIL_LEN) t.shift();
        }
        ctx.strokeStyle = m.color;
        ctx.lineWidth = r * 1.2;
        for (let i = 1; i < t.length; i++) {
          ctx.globalAlpha = (i / t.length) * 0.35;
          ctx.beginPath();
          ctx.moveTo(tx(t[i - 1].x), ty(t[i - 1].y));
          ctx.lineTo(tx(t[i].x), ty(t[i].y));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = m.color;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (total <= 40 || lead.has(m.id)) {
        ctx.font = `600 ${Math.max(11, scale * 0.42)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(2,6,23,0.9)';
        ctx.strokeText(m.name, sx, sy - r - 4);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(m.name, sx, sy - r - 4);
      }
    }
  }

  private drawMinimap(sim: Simulation, scale: number): void {
    const { ctx, w, h } = this;
    const map = sim.map;
    const mx = w - 18;
    const top = 70;
    const span = h - 24 - top;
    if (span < 40) return;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(mx - 3, top, 6, span);
    const vis = h / scale;
    const vy = top + ((this.camY - vis / 2) / map.height) * span;
    ctx.strokeStyle = 'rgba(248,250,252,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 6, vy, 12, (vis / map.height) * span);
    for (const m of sim.marbles) {
      if (m.arrived) continue;
      ctx.fillStyle = m.color;
      ctx.fillRect(mx - 1.5, top + (m.y / map.height) * span - 1.5, 3, 3);
    }
  }
}
