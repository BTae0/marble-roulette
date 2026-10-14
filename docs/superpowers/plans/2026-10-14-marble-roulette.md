# 마블 룰렛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** 구슬 물리 경주로 당첨자를 정하는 개인용 웹 룰렛(First/Last/Multiple, 맵 4종)을 구현한다.

**Architecture:** 순수 로직(names, rules)과 물리(engine), 렌더링(renderer), UI를 분리한다. 맵은 데이터로 정의하고 engine이 월드로 변환한다. 고정 타임스텝 시뮬레이션은 렌더링과 독립이라 헤드리스 테스트가 가능하다.

**Tech Stack:** Vite, TypeScript, planck (Box2D), Canvas 2D, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-14-marble-roulette-design.md`

## Global Constraints

- 최대 구슬 200개, 고정 타임스텝 1/60초, 타임아웃 120초 후 하향 힘으로 전원 도착 보장
- 끼임 감지: 2초간 이동 5 mm 미만이면 임펄스
- 시드 난수는 mulberry32, 같은 시드는 같은 결과
- 비밀값 하드코딩 없음, 외부 서버 통신 없음
- 코드 주석은 최소, 한국어 UI 문구

## Review Focus

- 빈 입력 / 공백만 입력: Start 비활성화
- `이름*0`, `이름*-1`, `이름*abc`, `*3`: 항목 무시 + 경고
- `이름*9999`: 200개로 잘라냄 + 경고
- Multiple K가 0이거나 구슬 수 초과: 1 ~ 구슬 수로 보정
- 구슬 1개만 있을 때 First/Last/Multiple 모두 정상 종료
- localStorage 접근 불가: 앱이 정상 동작

---

### Task 1: 프로젝트 스캐폴딩
**Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`
**Produces:** `npm run dev|build|test` 스크립트
- [ ] package.json / 설정 작성, `npm install` (planck, vite, typescript, vitest, playwright)
- [ ] `npm run build` 성공 확인

### Task 2: names.ts (TDD)
**Files:** Create `src/game/names.ts`, `src/game/names.test.ts`
**Produces:** `parseNames(input: string): { names: string[]; warnings: string[] }`, `shuffle<T>(arr: T[], rand: () => number): T[]`, `MAX_MARBLES = 200`, `mulberry32(seed: number): () => number`
- [ ] Review Focus의 입력 케이스를 포함한 실패 테스트 작성 → 실패 확인 → 구현 → 통과

### Task 3: rules.ts (TDD)
**Files:** Create `src/game/rules.ts`, `src/game/rules.test.ts`
**Produces:** `type Mode = 'first'|'last'|'multiple'`, `clampK(k: number, count: number): number`, `isFinished(mode, arrivedCount, total, k): boolean`, `pickWinners(mode, order: number[], k): number[]` (order는 도착 순서의 구슬 id)
- [ ] 경계값(구슬 1개, K 범위 밖) 테스트 → 구현 → 통과

### Task 4: 맵 데이터
**Files:** Create `src/game/maps/types.ts`, `pinball.ts`, `zigzag.ts`, `windmill.ts`, `funnel.ts`, `index.ts`
**Produces:** `MapDef { id; name; width; height; spawn: {x,y,w,h}; finish: {y}; statics: Shape[]; movers: Mover[]; restitution; friction }`, `MAPS: MapDef[]`
- [ ] 4개 맵 정의 (구슬이 막히지 않는 구조)

### Task 5: engine.ts + marble.ts (시뮬레이션 테스트)
**Files:** Create `src/game/engine.ts`, `src/game/marble.ts`, `src/game/engine.test.ts`
**Consumes:** `MapDef`, `mulberry32`
**Produces:** `class Simulation { constructor(map, names, seed); step(): void; marbles: MarbleState[]; arrivals: number[]; done: boolean; time: number }`, `MarbleState { id; name; x; y; color; arrived: boolean }`
- [ ] 시뮬레이션 테스트: 4개 맵 × 10/100/200개, 시드 고정, 전원 도착, 120초(7200스텝)+여유 내 종료 → 실패 확인 → 구현 → 통과
- [ ] 끼임 탈출, 타임아웃 후 하향 힘 구현 확인

### Task 6: renderer.ts
**Files:** Create `src/render/renderer.ts`
**Consumes:** `Simulation`, `MapDef`
**Produces:** `class Renderer { constructor(canvas); draw(sim, map): void; rankTop(sim, n): MarbleState[] }` — 카메라 보간 추적, 트레일, 라벨, 미니맵
- [ ] 구현, reduced-motion 시 트레일 축소

### Task 7: UI + main + styles
**Files:** Create `src/main.ts`, `src/ui/setup.ts`, `src/ui/result.ts`, `src/styles.css`
- [ ] 설정 화면(입력, 구슬 수, Shuffle, 맵 카드, 모드 토글, K 입력, Start)
- [ ] 경주 화면(리더보드, 배속, 일시정지, 처음으로), 결과 오버레이(당첨자 카드, 전체 순위, 다시/설정/복사)
- [ ] localStorage 저장/복원 try/catch
- [ ] 390px 반응형, 다크 글래스 디자인

### Task 8: 검증
- [ ] `npm test` 전체 통과, `npm run build` 성공
- [ ] Playwright로 설정 → 경주 → 결과, 데스크톱/390px 스크린샷 확인
- [ ] 독립 검토 1회 후 지적 사항 반영
