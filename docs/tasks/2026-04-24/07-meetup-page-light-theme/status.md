# Status: Meetup page light theme

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — converted meetup page + RsvpButton + RsvpActions + AttendeeCard + ShareButton to light theme. TypeScript clean.

**Decisions:**
- `page-bg-light` + light Nav to match /people and /profile.
- White cards with subtle shadow instead of dark glass.
- Bottom bar: `rgba(255,255,255,.92)` + backdrop blur (was dark purple).
- Cover image: removed dark overlay — just a clean image block.
- ShareButton icon color updated to dark since it now sits on a light bottom bar.

**Blockers:**
- None

**Feature description:**
- `/meetups/[id]` 페이지가 사이트의 나머지(People, Profile)와 동일한 라이트 테마로 변경됨. 다크 배경/텍스트 → 크림/화이트 배경 + 다크 텍스트.
