# Status: Profile completion gate

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — gate added in `/people/[id]/page.tsx`, banner added in `/profile/page.tsx`. TypeScript clean.

**Decisions:**
- 비로그인 유저는 게이트 대상 아님 — 기존 동작 유지.
- `?incomplete=1` query param으로 redirect 이유 전달 — URL이 명확하고 배너 트리거로 활용.
- 배너는 profile page 상단에 위치 — completeness bar 위.

**Blockers:**
- None

**Feature description:**
- 프로필을 100% 완성해야 다른 유저의 `/people/[id]` 페이지 열람 가능. 미완성 상태에서 접근 시 `/profile?incomplete=1`으로 redirect되며, 프로필 페이지 상단에 "Complete your profile first" 배너가 표시됨.
