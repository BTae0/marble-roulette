import { MAPS, getMap } from '../game/maps';
import { MAX_MARBLES } from '../game/names';
import { colorsFor } from '../game/marble';
import { clampK, type Mode } from '../game/rules';
import {
  addEntries,
  addNumbered,
  expand,
  removeEntry,
  setCount,
  shuffleEntries,
  total,
  type Entry,
} from '../game/roster';
import { drawMapThumb } from '../render/renderer';

export interface SetupValues {
  names: string[];
  mapId: string;
  mode: Mode;
  k: number;
}

const STORAGE_KEY = 'marble-roulette:v1';
const MODES: Mode[] = ['first', 'last', 'multiple'];

interface Saved {
  mapId?: unknown;
  mode?: unknown;
  k?: unknown;
}

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return typeof data === 'object' && data !== null ? (data as Saved) : null;
  } catch {
    return null;
  }
}

function save(data: { mapId: string; mode: Mode; k: number }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* 저장소를 쓸 수 없어도 동작에는 영향이 없다 */
  }
}

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다.`);
  return el as T;
}

function button(label: string, cls: string, aria: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = label;
  b.setAttribute('aria-label', aria);
  b.addEventListener('click', onClick);
  return b;
}

export function initSetup(onStart: (v: SetupValues) => void): { values(): SetupValues } {
  const inputEl = $<HTMLInputElement>('nameInput');
  const rosterEl = $('roster');
  const countEl = $('count');
  const warnEl = $('warnings');
  const mapsEl = $('maps');
  const mapDescEl = $('mapDesc');
  const modesEl = $('modes');
  const kWrap = $('kWrap');
  const kEl = $<HTMLInputElement>('k');
  const startEl = $<HTMLButtonElement>('start');

  const saved = load();
  let entries: Entry[] = [];
  let warnings: string[] = [];
  let mapId = typeof saved?.mapId === 'string' && MAPS.some((m) => m.id === saved.mapId) ? saved.mapId : MAPS[0].id;
  let mode: Mode = MODES.includes(saved?.mode as Mode) ? (saved!.mode as Mode) : 'first';
  kEl.value = String(typeof saved?.k === 'number' && Number.isFinite(saved.k) ? saved.k : 2);

  const mapButtons = MAPS.map((map) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'map-card';
    btn.setAttribute('role', 'radio');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 176;
    const label = document.createElement('span');
    label.textContent = map.name;
    btn.append(canvas, label);
    drawMapThumb(canvas, map);
    btn.addEventListener('click', () => {
      mapId = map.id;
      refresh();
    });
    mapsEl.append(btn);
    return { btn, id: map.id };
  });

  modesEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.mode as Mode;
      refresh();
    });
  });

  function values(): SetupValues {
    const names = expand(entries);
    return { names, mapId, mode, k: clampK(Number(kEl.value), names.length) };
  }

  function update(next: Entry[], nextWarnings: string[] = []): void {
    entries = next;
    warnings = nextWarnings;
    refresh();
  }

  function commitInput(text: string): void {
    const r = addEntries(entries, text);
    update(r.entries, r.warnings);
  }

  function renderRoster(): void {
    const colors = colorsFor(entries.map((e) => e.name));
    if (entries.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = '참가자를 추가해 주세요.';
      rosterEl.replaceChildren(li);
      return;
    }
    rosterEl.replaceChildren(
      ...entries.map((e, i) => {
        const li = document.createElement('li');
        li.className = 'entry';
        const sw = document.createElement('span');
        sw.className = 'sw';
        sw.style.background = colors[i];
        const nm = document.createElement('span');
        nm.className = 'nm';
        nm.textContent = e.name;
        const qty = document.createElement('span');
        qty.className = 'qty';
        const num = document.createElement('span');
        num.className = 'num';
        num.textContent = String(e.count);
        qty.append(
          button('−', 'step', `${e.name} 개수 줄이기`, () => update(setCount(entries, i, e.count - 1))),
          num,
          button('+', 'step', `${e.name} 개수 늘리기`, () => {
            const next = setCount(entries, i, e.count + 1);
            update(next, total(next) === total(entries) ? [`구슬은 최대 ${MAX_MARBLES}개까지만 사용합니다.`] : []);
          }),
        );
        li.append(sw, nm, qty, button('×', 'del', `${e.name} 삭제`, () => update(removeEntry(entries, i))));
        return li;
      }),
    );
  }

  function refresh(): void {
    const count = total(entries);
    countEl.textContent = `${count}개`;
    warnEl.replaceChildren(
      ...warnings.map((w) => {
        const li = document.createElement('li');
        li.textContent = w;
        return li;
      }),
    );
    renderRoster();
    startEl.disabled = count < 1;
    mapButtons.forEach(({ btn, id }) => btn.setAttribute('aria-checked', String(id === mapId)));
    mapDescEl.textContent = getMap(mapId).description;
    modesEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.mode === mode));
    });
    kWrap.classList.toggle('hidden', mode !== 'multiple');
    if (count > 0) kEl.max = String(count);
    save({ mapId, mode, k: Number(kEl.value) || 1 });
  }

  function submitInput(): void {
    const text = inputEl.value;
    if (!text.trim()) return;
    inputEl.value = '';
    commitInput(text);
    inputEl.focus();
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      submitInput();
    }
  });
  inputEl.addEventListener('paste', (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (/[\n,\t]/.test(text)) {
      e.preventDefault();
      commitInput(text);
    }
  });
  $('addBtn').addEventListener('click', submitInput);

  document.querySelectorAll<HTMLButtonElement>('.tool[data-n]').forEach((b) => {
    b.addEventListener('click', () => {
      const r = addNumbered(entries, Number(b.dataset.n));
      update(r.entries, r.warnings);
    });
  });
  $('shuffle').addEventListener('click', () => update(shuffleEntries(entries, Math.random)));
  $('clearAll').addEventListener('click', () => {
    update([]);
    inputEl.focus();
  });

  kEl.addEventListener('input', refresh);
  kEl.addEventListener('blur', () => {
    const count = total(entries);
    if (count > 0) kEl.value = String(clampK(Number(kEl.value), count));
    refresh();
  });
  startEl.addEventListener('click', () => {
    const v = values();
    if (v.names.length > 0) onStart(v);
  });

  refresh();
  return { values };
}
