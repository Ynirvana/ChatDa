# Status: Meetup OG image auto-generation

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — opengraph-image.tsx with Inter WOFF fonts from @fontsource/inter. Returns 200 image/png.

**Decisions:**
- Used `@fontsource/inter` WOFF files (not TTF/WOFF2) — Satori supports WOFF, and this avoids external font fetching at runtime.
- All JSX containers use `display: flex` explicitly — Satori requirement.
- Pre-computed all strings (no JSX-level string interpolation) — avoids multi-child Satori errors.
- `generateMetadata` always points to `/meetups/[id]/opengraph-image` — cover_image no longer used for OG.

**Blockers:**
- None

**Feature description:**
- 밋업 링크 공유 시 자동으로 브랜드 OG 이미지 생성. 호스트가 아무것도 안 해도 됨. ChatDa 핑크-오렌지 그라데이션 배경에 이벤트 제목, 날짜·시간·장소, 참가비·잔여석, "Hosted by [이름]", chatda.life 워터마크 포함.
