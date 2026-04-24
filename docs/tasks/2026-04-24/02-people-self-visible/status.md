# Status: People tab — show self + Save redirects to /people

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — removed self-exclusion from backend directory, added isMe prop + "You" badge to PersonCard, Save now redirects to /people. TypeScript clean.

**Decisions:**
- Mutual connection count still skips self (no meaningful value for own card).
- "You" badge uses muted gray style to not compete visually with other CTAs.

**Blockers:**
- None

**Feature description:**
- **본인 카드 노출**: 로그인한 유저도 People 탭에서 자기 카드를 볼 수 있음. 카드 하단에 Connect 버튼 대신 "You" 뱃지 표시.
- **Save 후 redirect**: Profile 페이지에서 Save 누르면 `/people`로 이동. 프로필 편집 결과를 People 탭에서 바로 확인 가능.
