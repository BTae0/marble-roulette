import { World, Vec2, Circle, Box, type Body } from 'planck';
import type { MapDef } from './maps';
import { mulberry32, shuffle } from './names';
import {
  MARBLE_R,
  STUCK_SEC,
  STUCK_DIST,
  STALL_SEC,
  MAX_NUDGE_POWER,
  colorsFor,
  spawnPositions,
  type MarbleRuntime,
  type MarbleState,
} from './marble';

export const DT = 1 / 60;
export const GRAVITY = 4;
export const DAMPING = 0.4;
const WALL = 1;
const PORTAL_COOLDOWN_SEC = 1.5;

interface MoverRuntime {
  body: Body;
  kind: 'rotor' | 'slider';
  baseX: number;
  range: number;
  speed: number;
  phase?: number;
}

export class Simulation {
  readonly map: MapDef;
  readonly marbles: MarbleState[] = [];
  readonly arrivals: number[] = [];
  readonly world: World;
  time = 0;
  done = false;

  private runtimes: MarbleRuntime[] = [];
  private movers: MoverRuntime[] = [];
  private rand: () => number;

  constructor(map: MapDef, names: string[], seed: number) {
    this.map = map;
    this.rand = mulberry32(seed);
    this.world = new World({ gravity: new Vec2(0, GRAVITY) });
    this.buildMap();
    const colors = colorsFor(names);
    const order = shuffle(names.map((_, i) => i), this.rand);
    this.buildMarbles(
      order.map((i) => names[i]),
      order.map((i) => colors[i]),
    );
    if (names.length === 0) this.done = true;
  }

  private buildMap(): void {
    const { width: w, height: h, friction, restitution } = this.map;
    const ground = this.world.createBody({ type: 'static' });
    const fx = { friction, restitution };
    ground.createFixture({ shape: new Box(WALL / 2, h / 2 + 10, new Vec2(-WALL / 2, h / 2)), ...fx });
    ground.createFixture({ shape: new Box(WALL / 2, h / 2 + 10, new Vec2(w + WALL / 2, h / 2)), ...fx });
    ground.createFixture({ shape: new Box(w / 2 + WALL, WALL / 2, new Vec2(w / 2, -WALL * 3)), ...fx });
    ground.createFixture({ shape: new Box(w / 2 + WALL, WALL / 2, new Vec2(w / 2, h + 8)), ...fx });
    for (const s of this.map.statics) {
      if (s.kind === 'circle') {
        ground.createFixture({
          shape: new Circle(new Vec2(s.x, s.y), s.r),
          ...fx,
          restitution: s.bounce ?? restitution,
        });
      } else {
        ground.createFixture({
          shape: new Box(s.w / 2, s.h / 2, new Vec2(s.x, s.y), s.angle ?? 0),
          ...fx,
        });
      }
    }
    for (const m of this.map.movers) {
      const startX = m.kind === 'slider' ? m.x + m.range * Math.sin(m.phase ?? 0) : m.x;
      const body = this.world.createKinematicBody({ position: new Vec2(startX, m.y) });
      if (m.kind === 'rotor') {
        body.createFixture({ shape: new Box(m.length / 2, m.thickness / 2), ...fx });
        body.setAngularVelocity(m.speed);
        this.movers.push({ body, kind: 'rotor', baseX: m.x, range: 0, speed: m.speed });
      } else {
        body.createFixture({ shape: new Box(m.w / 2, m.h / 2), ...fx });
        this.movers.push({ body, kind: 'slider', baseX: m.x, range: m.range, speed: m.speed, phase: m.phase ?? 0 });
      }
    }
  }

  private buildMarbles(names: string[], colors: string[]): void {
    const pos = spawnPositions(names.length, this.map.spawn, this.rand);
    names.forEach((name, id) => {
      const body = this.world.createDynamicBody({
        position: new Vec2(pos[id].x, pos[id].y),
        linearDamping: DAMPING,
      });
      body.createFixture({
        shape: new Circle(MARBLE_R),
        density: 1,
        friction: this.map.friction,
        restitution: this.map.restitution,
      });
      const state: MarbleState = {
        id,
        name,
        color: colors[id],
        x: pos[id].x,
        y: pos[id].y,
        arrived: false,
        rank: -1,
      };
      this.marbles.push(state);
      this.runtimes.push({ state, body, anchorX: state.x, anchorY: state.y, stillTime: 0, stuckCount: 0, bestY: state.y, bestAt: 0, lastPortal: -10 });
    });
  }

  step(): void {
    if (this.done) return;
    this.time += DT;
    for (const m of this.movers) {
      if (m.kind === 'slider') {
        const dx = m.range * Math.sin(this.time * m.speed + (m.phase ?? 0)) - (m.body.getPosition().x - m.baseX);
        m.body.setLinearVelocity(new Vec2(dx / DT, 0));
      }
    }
    this.applyZones();
    this.world.step(DT, 8, 3);
    for (const r of this.runtimes) {
      if (r.state.arrived) continue;
      const p = r.body.getPosition();
      r.state.x = p.x;
      r.state.y = p.y;
      if (p.y >= this.map.finishY) {
        r.state.arrived = true;
        r.state.rank = this.arrivals.length;
        this.arrivals.push(r.state.id);
        r.body.setActive(false);
        continue;
      }
      this.checkStuck(r);
    }
    if (this.arrivals.length === this.marbles.length) this.done = true;
  }

  zoneWind(z: { ax?: number; ay?: number; period?: number }): { ax: number; ay: number } {
    const gust = z.period ? Math.sin((2 * Math.PI * this.time) / z.period) : 1;
    return { ax: (z.ax ?? 0) * gust, ay: (z.ay ?? 0) * gust };
  }

  private applyZones(): void {
    if (this.map.zones.length === 0) return;
    for (const r of this.runtimes) {
      if (r.state.arrived) continue;
      const { x, y } = r.state;
      const mass = r.body.getMass();
      for (const z of this.map.zones) {
        if (Math.abs(x - z.x) > z.w / 2 || Math.abs(y - z.y) > z.h / 2) continue;
        if (z.kind === 'wind') {
          const w = this.zoneWind(z);
          r.body.applyForceToCenter(new Vec2(w.ax * mass, w.ay * mass), true);
        } else if (z.kind === 'slow') {
          const v = r.body.getLinearVelocity();
          r.body.applyForceToCenter(new Vec2(-v.x * z.damping * mass, -v.y * z.damping * mass), true);
        } else if (this.time - r.lastPortal > PORTAL_COOLDOWN_SEC) {
          const t = z.targets[Math.floor(this.rand() * z.targets.length)];
          r.body.setTransform(new Vec2(t.x, t.y), 0);
          r.body.setLinearVelocity(new Vec2(0, 1));
          r.state.x = t.x;
          r.state.y = t.y;
          r.lastPortal = this.time;
          r.bestY = t.y;
          r.bestAt = this.time;
          r.anchorX = t.x;
          r.anchorY = t.y;
        }
      }
    }
  }

  private nudge(r: MarbleRuntime): void {
    const mass = r.body.getMass();
    const dir = this.rand() < 0.5 ? -1 : 1;
    const power = Math.min(MAX_NUDGE_POWER, 1 + r.stuckCount * 0.6);
    r.stuckCount++;
    r.body.applyLinearImpulse(
      new Vec2(dir * mass * 1.2 * power, -mass * 0.8 * power),
      r.body.getWorldCenter(),
      true,
    );
  }

  private checkStuck(r: MarbleRuntime): void {
    if (r.state.y > r.bestY + 0.05) {
      r.bestY = r.state.y;
      r.bestAt = this.time;
      r.stuckCount = 0;
    } else if (this.time - r.bestAt > STALL_SEC) {
      this.nudge(r);
      r.bestAt = this.time;
    }
    r.stillTime += DT;
    if (r.stillTime < STUCK_SEC) return;
    const dist = Math.hypot(r.state.x - r.anchorX, r.state.y - r.anchorY);
    if (dist < STUCK_DIST) this.nudge(r);
    r.anchorX = r.state.x;
    r.anchorY = r.state.y;
    r.stillTime = 0;
  }

  ranking(): MarbleState[] {
    const arrived = this.arrivals.map((id) => this.marbles[id]);
    const rest = this.marbles.filter((m) => !m.arrived).sort((a, b) => b.y - a.y);
    return [...arrived, ...rest];
  }

  moverStates():{ x: number; y: number; angle: number }[] {
    return this.movers.map((m) => {
      const p = m.body.getPosition();
      return { x: p.x, y: p.y, angle: m.body.getAngle() };
    });
  }
}
