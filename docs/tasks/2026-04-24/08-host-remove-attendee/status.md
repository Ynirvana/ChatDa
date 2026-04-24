# Status: Host can remove approved attendees

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — backend accepts cancelled status, GET /host/events returns approved_rsvps, HostingSection shows Going list with Remove button. TypeScript clean.

**Decisions:**
- Status set to `cancelled` (existing DB enum value) — same as other cancellation flows.
- `approved_rsvps` fetched in same query as `pending_rsvps` (no extra DB round trip).

**Blockers:**
- None

**Feature description:**
- 호스트가 `/profile`의 이벤트 카드에서 승인된 참가자 목록("Going")을 확인하고, 각 참가자 옆의 "Remove" 버튼으로 제거할 수 있음. 제거 시 RSVP 상태가 `cancelled`로 변경됨.
