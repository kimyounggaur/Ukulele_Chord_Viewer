# Lesson Designer Ukulele Chord Viewer

우쿨렐레 학습자가 코드 운지 이미지를 16:9 화면 전체에서 빠르게 찾아보는 React SPA입니다. `코드 Source` 폴더의 원본 PNG를 `public/chords`로 복사해 정적 이미지 우선으로 표시하고, 원본이 없는 코드는 4현 GCEA SVG 다이어그램으로 폴백합니다.

## 실행

```bash
npm install
npm run dev
npm run build
```

## 구조

```txt
public/chords/              원본 코드 이미지와 manifest
src/components/             화면/카드/다이어그램/업로드 UI
src/data/                   코드 타입, 품질, 운지 데이터
src/hooks/                  검색과 IndexedDB 이미지 훅
src/lib/                    slug, 이미지 저장 로직
src/styles/globals.css      16:9 풀스크린 셸과 이미지 contain 규칙
```

## 이미지 규칙

기본 이미지는 `/public/chords/{quality}/{root}.png` 규칙을 사용합니다. 예시는 `chords/major/c.png`, `chords/minor7/c-sharp.png`, `chords/minor7-flat5/a.png`입니다. GitHub Pages 배포에서는 Vite `base`가 `/Ukulele_Chord_Viewer/`로 설정되어 이미지와 JS/CSS가 저장소 하위 경로에서 로드됩니다. 모든 원본 이미지는 `object-fit: contain`, `max-width: 100%`, `max-height: 100%`, `width: auto`, `height: auto`로만 표시해 늘어남과 잘림을 막습니다.

이미지 표시 우선순위는 IndexedDB 업로드 이미지, 정적 원본 이미지, 동적 SVG 폴백 순서입니다.

## 업로드와 한계

상세 화면에서 `svg/png/webp`, 2MB 이하 이미지를 업로드하면 IndexedDB에 저장되어 같은 브라우저에서 새로고침 후에도 유지됩니다.

정적 배포된 웹사이트의 public 폴더는 브라우저에서 직접 수정할 수 없다. 기본 이미지는 개발자가 프로젝트에 포함해 배포하고, 사용자 업로드 이미지는 IndexedDB 또는 서버 스토리지에 저장해야 한다.

전체 사용자에게 공유되는 업로드가 필요하면 Supabase Storage, S3, R2 같은 object storage와 메타데이터 DB를 연결하면 됩니다.

## 배포

백엔드 없이 정적 사이트로 동작하므로 Vercel, Netlify, GitHub Pages에 배포할 수 있습니다. 원본 이미지 라이선스가 명확한지 확인한 뒤 배포하세요.

GitHub Pages는 `.github/workflows/deploy.yml`에서 `npm run build` 후 `dist`를 배포합니다.
