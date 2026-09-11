# Phase 10 — GitHub Pages 배포 안정화

검증일: 2026-09-11 (Asia/Seoul)

## 구현 결과

- Vite base와 PWA `id`, `start_url`, `scope`를 `/Ukulele_Chord_Viewer/`로 유지했다.
- SPA는 `HashRouter`를 사용하며 별도 `404.html` 우회가 필요 없다.
- 모든 런타임 정적 에셋은 `asset()` 헬퍼로 repository base를 붙인다.
- `public/.nojekyll`을 0바이트로 추가했다.
- 1200×630 PNG OG 카드와 Open Graph/Twitter/canonical 메타데이터를 추가했다.
- GitHub Actions는 불변 커밋 SHA로 고정하고 `verify → check:images → build → check:pwa → check:deploy`가 모두 성공한 뒤에만 업로드한다.
- Pages 업로더에 `include-hidden-files: true`를 지정해 `.nojekyll`이 실제 아티팩트에 포함되게 했다.
- build 작업은 읽기 권한만, deploy 작업만 Pages/OIDC 쓰기 권한을 갖는다.

## 로컬 프로덕션 검증

| 검사 | 결과 |
|---|---:|
| 코드 데이터 | 112개 코드·112개 운지 통과 |
| 코드 이미지 | 원본 80 + 폴백 80 + 상세 WebP 80 + 썸네일 WebP 80 통과 |
| 전체 `dist` | 2,990,311B / 3,000,000B |
| 초기 JS gzip | 93,917B / 120,000B |
| OG 이미지 | PNG 1200×630, 8,387B |
| PWA precache | 통과 |
| npm audit | 취약점 0개 |

프로덕션 미리보기에서 다음 요청은 모두 HTTP 200을 확인했다.

- `/Ukulele_Chord_Viewer/`
- `/Ukulele_Chord_Viewer/manifest.webmanifest`
- `/Ukulele_Chord_Viewer/chords/major/c.png`
- `/Ukulele_Chord_Viewer/og-image.png`

새 브라우저에서 `/Ukulele_Chord_Viewer/#/c/Am`을 직접 연 뒤 새로고침했으며, `Am` H1과 Am 운지 설명이 다시 렌더링되는 것을 확인했다. 크롤러 User-Agent로 받은 원본 HTML에서도 절대 OG 이미지 URL과 `summary_large_image`를 확인했다. 배포 아티팩트 모의 tar에는 `./.nojekyll`이 포함됐다.

## 원격 배포 전제 조건

코드는 배포 준비가 끝났지만 이 작업에서는 원격 push를 수행하지 않았다. 현재 GitHub의 `github-pages` 환경 보호 규칙은 `main` 배포를 허용하지 않아, 기존 공개 워크플로가 다음 사유로 거절된 상태다.

> Branch "main" is not allowed to deploy to github-pages due to environment protection rules.

최초 배포 전에 저장소 `Settings → Environments → github-pages → Deployment branches and tags`에서 `main`을 허용하고, Pages의 게시 원본을 `GitHub Actions`로 설정해야 한다. 이후 main push가 완료되면 공개 URL 네 개와 `#/c/Am` 새로고침을 다시 확인하고, 카카오톡/Slack의 캐시를 비운 새 대화에서 실제 링크 카드 노출을 최종 확인한다.

## 완료 판정

- [x] `.nojekyll`이 source, build, 업로드 아티팩트에 존재한다.
- [x] HashRouter 딥링크가 새 브라우저 새로고침 뒤에도 렌더링된다.
- [x] OG 메타와 이미지의 경로·형식·크기·로컬 크롤러 응답이 올바르다.
- [x] CI 검증 실패 시 upload/deploy로 진행하지 않는다.
- [ ] 공개 카카오톡/Slack 링크 미리보기 실검증 — 원격 push와 환경 규칙 변경 후 가능.
