# 마블 룰렛

이름을 입력하면 구슬이 되어 물리 엔진 위에서 경주하고, 결과로 당첨자를 정하는 웹 추첨 게임입니다.

- 당첨 방식: First(1등) / Last(꼴찌) / Multiple(상위 K명)
- 맵 4종: 핀볼, 지그재그, 회전 풍차, 깔때기 (돌풍·끈적 구역·포털 등 변수 환경 포함)
- 참가자 입력: 이름 입력 후 Enter, `이름*3` 표기, 여러 명 붙여넣기, 번호로 추가
- 마우스 드래그·휠로 맵 이동, 1x/2x/4x 배속

물리 시뮬레이션 결과이므로 맵 형태에 따라 확률이 균등하지 않을 수 있습니다.

## 실행

```
npm install
npm run dev      # 개발 서버
npm test         # 단위·시뮬레이션 테스트
npm run build    # dist/ 생성
```

기술 스택: Vite, TypeScript, planck.js(Box2D), Canvas 2D, Vitest
