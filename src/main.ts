import './styles.css';
import { DT, Simulation } from './game/engine';
import { getMap } from './game/maps';
import { pickWinners } from './game/rules';
import { Renderer, type Follow } from './render/renderer';
import { initSetup, type SetupValues } from './ui/setup';
import { renderResult, resultText, runConfetti } from './ui/result';

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다.`);
  return el as T;
}

const setupScreen = $('setup');
const raceScreen = $('race');
const resultEl = $('result');
const stage = $<HTMLCanvasElement>('stage');
const boardEl = $('board');
const speedBtn = $<HTMLButtonElement>('speed');
const pauseBtn = $<HTMLButtonElement>('pause');
const followBtn = $<HTMLButtonElement>('follow');
const BOARD_ROWS = 5;
const RESULT_DELAY_MS = 1200;

let renderer: Renderer | null = null;
let sim: Simulation | null = null;
let current: SetupValues | null = null;
let raf = 0;
let last = 0;
let acc = 0;
let speed = 1;
let paused = false;
let ended = false;
let resultTimer = 0;
let stopConfetti: () => void = () => undefined;
let boardTick = 0;

const setup = initSetup(startRace);

function newSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

function showScreen(name: 'setup' | 'race'): void {
  setupScreen.classList.toggle('hidden', name !== 'setup');
  raceScreen.classList.toggle('hidden', name !== 'race');
}

function startRace(values: SetupValues): void {
  current = values;
  hideResult();
  showScreen('race');
  renderer ??= new Renderer(stage);
  renderer.resize();
  renderer.reset();
  sim = new Simulation(getMap(values.mapId), values.names, newSeed());
  speed = 1;
  paused = false;
  ended = false;
  acc = 0;
  boardTick = 0;
  speedBtn.textContent = '1x';
  updateFollowBtn();
  pauseBtn.textContent = '일시정지';
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function follow(): Follow {
  return current?.mode === 'last' ? 'last' : 'leader';
}

function frame(now: number): void {
  raf = requestAnimationFrame(frame);
  if (!sim || !renderer || !current) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!paused) {
    acc += dt * speed;
    let n = 0;
    while (acc >= DT && n < 8 && !sim.done) {
      sim.step();
      acc -= DT;
      n++;
    }
    if (acc > DT * 8) acc = 0;
  }
  renderer.draw(sim, follow());
  if (boardTick++ % 8 === 0) updateBoard();
  if (!ended && sim.done) {
    ended = true;
    resultTimer = window.setTimeout(showResult, RESULT_DELAY_MS);
  }
}

function updateBoard(): void {
  if (!sim) return;
  const rows = sim.ranking().slice(0, BOARD_ROWS);
  const ol = document.createElement('ol');
  rows.forEach((m, i) => {
    const li = document.createElement('li');
    const no = document.createElement('span');
    no.className = 'no';
    no.textContent = String(i + 1);
    const sw = document.createElement('span');
    sw.className = 'sw';
    sw.style.background = m.color;
    const nm = document.createElement('span');
    nm.className = 'nm';
    nm.textContent = m.name;
    li.append(no, sw, nm);
    if (m.arrived) {
      const fin = document.createElement('span');
      fin.className = 'fin';
      fin.textContent = 'FINISH';
      li.append(fin);
    }
    ol.append(li);
  });
  const title = document.createElement('h2');
  title.textContent = '실시간 순위';
  boardEl.replaceChildren(title, ol);
}

function showResult(): void {
  if (!sim || !current) return;
  paused = true;
  const ranking = sim.ranking();
  const ids = pickWinners(current.mode, sim.arrivals, current.k);
  const winners = ids.map((id) => sim!.marbles[id]);
  renderResult(current.mode, winners, ranking);
  resultEl.classList.remove('hidden');
  stopConfetti();
  stopConfetti = runConfetti($<HTMLCanvasElement>('confetti'));
}

function hideResult(): void {
  window.clearTimeout(resultTimer);
  stopConfetti();
  resultEl.classList.add('hidden');
}

function backToSetup(): void {
  hideResult();
  cancelAnimationFrame(raf);
  sim = null;
  showScreen('setup');
}

$('back').addEventListener('click', backToSetup);
$('toSetup').addEventListener('click', backToSetup);
$('again').addEventListener('click', () => startRace(current ?? setup.values()));
speedBtn.addEventListener('click', () => {
  speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  speedBtn.textContent = `${speed}x`;
});
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '재개' : '일시정지';
});
$('copy').addEventListener('click', async (e) => {
  if (!sim || !current) return;
  const btn = e.currentTarget as HTMLButtonElement;
  const ids = pickWinners(current.mode, sim.arrivals, current.k);
  const text = resultText(current.mode, ids.map((id) => sim!.marbles[id]), sim.ranking());
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = '복사됨';
  } catch {
    btn.textContent = '복사 실패';
  }
  window.setTimeout(() => (btn.textContent = '결과 복사'), 1500);
});
function updateFollowBtn(): void {
  followBtn.textContent = renderer?.auto === false ? '자동 추적 꺼짐 (클릭)' : '자동 추적 켜짐';
}

let dragLastY: number | null = null;
stage.addEventListener('pointerdown', (e) => {
  dragLastY = e.clientY;
  stage.setPointerCapture(e.pointerId);
  stage.classList.add('dragging');
});
stage.addEventListener('pointermove', (e) => {
  if (dragLastY === null) return;
  renderer?.panBy(dragLastY - e.clientY);
  dragLastY = e.clientY;
  updateFollowBtn();
});
const endDrag = (): void => {
  dragLastY = null;
  stage.classList.remove('dragging');
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    renderer?.panBy(e.deltaY);
    updateFollowBtn();
  },
  { passive: false },
);
followBtn.addEventListener('click', () => {
  if (!renderer) return;
  renderer.auto = !renderer.auto;
  updateFollowBtn();
});
window.addEventListener('resize', () => renderer?.resize());
