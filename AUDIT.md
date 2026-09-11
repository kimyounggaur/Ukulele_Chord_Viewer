# 우쿨렐레 코드 뷰어 — PHASE 0 코드베이스 감사

기준 커밋: `e884f3f` (`main`, `origin/main`과 일치)  
감사일: 2026-09-11  
범위: `deploy-src/` 정적 React SPA. 이 디렉터리가 Git 원격 저장소와 GitHub Pages 워크플로를 가진 실제 배포 소스다.

## 1. 구조 스캔

### 1.1 빌드와 스택

| 항목 | 확인 결과 | 근거 |
|---|---|---|
| 프레임워크 | React 18.3.1 + React DOM 18.3.1 | `package.json` |
| 빌드 | Vite 6.0.3, `tsc -b && vite build` | `package.json` |
| 언어 | TypeScript 5.6.3 | `package.json` |
| 스타일 | Tailwind CSS 3.4.16 + 전역 CSS | `package.json`, `src/styles/globals.css` |
| 데이터/인증 | IndexedDB(`idb`) + Supabase Auth | `package.json`, `src/hooks/useAuth.ts`, `src/hooks/useIndexedChordImages.ts` |
| 아이콘 | lucide-react 0.468 | `package.json` |
| Vite base | `/Ukulele_Chord_Viewer/` | `vite.config.ts` |
| TS strict | 활성화 | `tsconfig.app.json`의 `strict: true` |
| 라우터 | 없음 | `package.json`, `src/App.tsx` |
| 전역 상태 라이브러리 | 없음 | `package.json` |

기준 빌드는 성공했다. 결과는 JS 417.02 kB, CSS 41.67 kB이고, 정적 코드 이미지까지 포함한 `dist` 총량은 11,677,016 bytes다.

### 1.2 소스 트리

```text
src/
├─ App.tsx
├─ main.tsx
├─ vite-env.d.ts
├─ components/
│  ├─ AdminPage.tsx
│  ├─ AppHeader.tsx
│  ├─ AppShell.tsx
│  ├─ ChordCard.tsx
│  ├─ ChordDetail.tsx
│  ├─ ChordDiagram.tsx
│  ├─ ChordGrid.tsx
│  ├─ ChordImage.tsx
│  ├─ ChordImageUploader.tsx
│  ├─ EmptyState.tsx
│  ├─ FingerHintLayer.tsx
│  ├─ Fretboard.tsx
│  ├─ QualityBubble.tsx
│  └─ QualitySelector.tsx
├─ data/
│  ├─ chordQualities.ts
│  ├─ chords.ts
│  ├─ chordTypes.ts
│  └─ fingerHotspots.ts
├─ hooks/
│  ├─ useAuth.ts
│  ├─ useChordSearch.ts
│  ├─ useClickSound.ts
│  └─ useIndexedChordImages.ts
├─ lib/
│  ├─ chordDisplay.ts
│  ├─ chordImageStorage.ts
│  ├─ slug.ts
│  └─ supabase.ts
└─ styles/globals.css
```

`src`에는 30개 파일이 있다. 컴포넌트별 줄 수는 다음과 같다.

| 컴포넌트 | 줄 수 | 컴포넌트 | 줄 수 |
|---|---:|---|---:|
| AdminPage | 106 | AppHeader | 336 |
| AppShell | 20 | ChordCard | 58 |
| ChordDetail | 99 | ChordDiagram | 29 |
| ChordGrid | 77 | ChordImage | 149 |
| ChordImageUploader | 154 | EmptyState | 7 |
| FingerHintLayer | 46 | Fretboard | 154 |
| QualityBubble | 33 | QualitySelector | 43 |

`public`에는 84개 파일이 있고, 이미지 파일은 PNG 81개, JPG 1개, SVG 1개다. `public/chords`의 다이어그램 에셋은 81개(80 PNG + 폴백 SVG), 총 11,131,970 bytes다.

### 1.3 코드 데이터

- `src/data/chords.ts`가 패턴 테이블을 `buildChord()`로 변환해 `staticChords`를 만든다.
- 품질 메타데이터는 `src/data/chordQualities.ts`, 타입은 `src/data/chordTypes.ts`, 이미지 위 손가락 좌표는 `src/data/fingerHotspots.ts`로 나뉘어 있어 단일 진실 공급원은 아니다.
- 총 93개 코드, 13개 품질이 생성된다. 메인 선택 화면은 `minor6`을 제외한 12개 품질만 노출한다.
- 줄 순서는 `STRING_ORDER = [4, 3, 2, 1]`로 선언되어 G-C-E-A 순서를 사용한다.

현재 코드 하나의 타입 전문:

```ts
export interface ChordShape {
  id: string;
  title: string;
  root: string;
  quality: ChordQualityId;
  positions: FingerPosition[];
  baseFret?: number;
  image?: string;
  tags?: string[];
}
```

문제점은 `notes`, 난이도, 대체 운지 배열, 바레 정보가 없고 프렛이 `positions` 객체 배열로 흩어져 있다는 점이다. 일부 패턴은 이론 구성음 집합과 일치하지 않으며 자동 검증 스크립트도 없다.

### 1.4 이미지

- 규칙: `public/chords/{quality}/{root-slug}.png`.
- 앱은 `import.meta.env.BASE_URL`을 붙여 GitHub Pages 하위 경로를 처리한다.
- 등록 코드 93개 중 79개가 정적 이미지를 참조하고, `diminish`/`augment` 14개는 SVG 프렛보드로 표시한다.
- `public/chords/minor7/f.png`는 어느 코드도 참조하지 않는 고아 이미지다.
- 업로드 이미지 → 정적 이미지 → 프렛보드 순서다. 다만 정적 이미지 로드 실패 시 코드별 SVG가 아니라 일반 `chord-placeholder.svg`로 교체된다.
- 코드 이미지 CSS는 `object-fit: contain`, `max-width/max-height: 100%`, `width/height: auto`를 사용한다.

### 1.5 라우팅과 상태

- `react-router`를 사용하지 않는다. 화면은 `src/App.tsx`의 `useState`(`selectedQualityId`, `selectedChordId`, `adminPageOpen`)로 전환된다.
- URL 딥링크, 새로고침 복원, 브라우저 뒤로가기 동기화가 없다.
- 전역 상태 저장소는 없다. 인증은 `useAuth`, 업로드 이미지는 `useIndexedChordImages`가 관리한다.

## 2. 규칙 위반 및 결함 감사

### A. 절대 규칙

| 항목 | 판정 | 근거 |
|---|---|---|
| A1 루트 100dvw/100dvh + overflow:hidden | **위반** | `#app-root`는 `width:100%`, `min-height:100dvh`, `overflow-x:hidden`만 사용한다. |
| A2 100vh 폴백 | **위반** | `--app-h` 또는 `@supports(height:100dvh)`가 없다. |
| A3 코드 이미지 contain | **준수** | `.chord-image`에 `object-fit:contain`, max 크기 100%, auto 크기 지정. |
| A4 이미지 고정 width+height 동시 지정 | **위반** | 모바일 `.detail-image-frame img { width:100%; height:100%; }`가 절대 규칙과 충돌한다. |

### B. 렌더링과 레이아웃

| 항목 | 판정 | 근거 |
|---|---|---|
| B1 390×844 | **부분 준수** | 홈 화면은 보이지만 루트가 고정 높이/내부 스크롤 구조가 아니다. |
| B2 안전영역 + viewport-fit | **위반** | 일부 `env(safe-area-inset-*)`만 있고 `viewport-fit=cover`가 없다. |
| B3 방향 전환 | **부분 준수** | CSS orientation 쿼리는 있으나 844×390에서 문서 높이가 444px로 넘친다. |
| B4 16:9 전체 화면 | **위반** | `.stage-16x9`는 레터박스형 중앙 정렬이며 앱 셸에 적용되지 않는다. |

브라우저 기준선: 390×844에서는 문서 390×844, 844×390에서는 문서 829×444로 세로 넘침, 1280×720과 1920×1080 홈은 문서 크기가 뷰포트와 일치했다.

### C. 견고성

| 항목 | 판정 | 근거 |
|---|---|---|
| C1 `<img>` onError 폴백 | **부분 준수** | `ChordImage`에 onError가 있으나 일반 폴백 이미지로만 교체한다. |
| C2 없는 코드 접근 | **확인 불가** | URL 라우팅 자체가 없어 없는 URL 코드 상태가 존재하지 않는다. |
| C3 ErrorBoundary | **위반** | 전역 ErrorBoundary가 없다. |
| C4 업로드 오류 격리 | **준수** | 업로드 훅/컴포넌트가 오류를 메시지로 처리한다. |

### D. 접근성

| 항목 | 판정 | 근거 |
|---|---|---|
| D1 클릭 요소 시맨틱 | **대체로 준수** | 주요 상호작용은 `<button>`이며 모달 배경만 프레젠테이션 div 이벤트를 쓴다. |
| D2 이미지 대체 텍스트 | **부분 준수** | 코드 이미지는 alt가 있으나 장식 이미지 중 빈 alt와 의미/장식 구분이 일관되지 않다. |
| D3 키보드 그리드 | **위반** | roving tabindex와 방향키/Home/End 탐색이 없다. |
| D4 포커스 복원 | **위반** | 상세에서 Escape 복귀는 되지만 원 카드로 포커스를 되돌리지 않는다. |
| D5 전역 focus-visible | **부분 준수** | 여러 Tailwind 링은 있으나 전 인터랙션 공통 3px 포커스 링이 없다. |
| D6 모션 감소 | **부분 준수** | 마스코트 일부만 억제하고 모든 전환/애니메이션을 억제하지 않는다. |
| D7 고대비 모드 | **위반** | 사용자 토글과 `prefers-contrast` 처리가 없다. |

### E. 기능

| 항목 | 판정 | 근거 |
|---|---|---|
| E1 정확한 SSOT/검증 | **위반** | 타입·품질·프렛·이미지·핫스팟이 분산되고 `verify`가 없다. |
| E2 이미지↔SVG 자동 폴백 | **위반** | 로드 실패는 코드 SVG가 아니라 공통 플레이스홀더다. |
| E3 코드 오디오 | **위반** | `useClickSound`는 UI 클릭음만 합성한다. |
| E4 검색 | **부분 준수** | 로그인 사용자만 단순 포함 검색이 가능하고 이명동음/한글 정규화가 없다. |
| E5 즐겨찾기/최근 | **위반** | 구현 없음. |
| E6 수업 세트/슬라이드/인쇄/퀴즈 | **위반** | 구현 없음. |
| E7 PWA/오프라인 | **위반** | manifest와 service worker가 없다. |

### F. 배포

| 항목 | 판정 | 근거 |
|---|---|---|
| F1 Vite base | **준수** | `/Ukulele_Chord_Viewer/`. |
| F2 `.nojekyll` | **위반** | `public/.nojekyll`이 없다. |
| F3 SPA 딥링크 | **위반** | 라우터/404 처리 없음. |
| F4 메타데이터 | **부분 준수** | `lang=ko`, title/description은 있으나 theme/OG/X/favicon이 없다. |
| F5 배포 검증 게이트 | **위반** | Actions는 `npm run build`만 실행한다. |
| F6 정적 manifest 안전성 | **위반** | `public/chords/manifest.json`이 로컬 Windows 절대 경로를 노출한다. |

## 3. 우선순위 TOP 5

1. 코드 데이터를 `[G,C,E,A]` 튜플 중심 SSOT로 통합하고 기계 검증을 추가한다.
2. 이미지 실패 시 정확한 코드 SVG로 즉시 폴백하도록 렌더러를 통합한다.
3. 앱 셸을 `100vh/100dvh`, safe area, 내부 스크롤 구조로 고쳐 모든 지정 해상도를 안정화한다.
4. Hash 기반 딥링크, 검색 정규화, 즐겨찾기/최근 기록을 추가해 실제 수업 탐색 흐름을 만든다.
5. 오디오·수업 세트·PWA를 추가한 뒤 이미지/WebP와 코드 분할로 배포 크기와 오프라인 신뢰성을 개선한다.

## 4. PHASE 0 완료 판정

- [x] A–F 전 항목을 `위반 / 준수 / 부분 준수 / 확인 불가`로 판정했다.
- [x] 확인 불가 항목은 1개다.
- [x] 현재 코드 타입 전문을 확보했다.
- [x] 등록 코드 93개, 코드 다이어그램 에셋 81개, 정적 이미지 참조 79개, 고아 이미지 1개의 차이를 확인했다.

