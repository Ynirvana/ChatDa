# Status: Meetup Hosting

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — backend updates, HostingSection component, EventRsvpButton component, profile + public profile pages wired up. TypeScript clean.

**Decisions:**
- All approved users can host — no separate host approval needed.
- `meeting_details` (stored as `directions` in DB) shown only to approved attendees and the host.
- Hosting section on `/people/[id]` shows upcoming events only (date >= today) — already filtered in backend.
- RSVP button shows inline message input before sending — keeps UX lightweight without a modal.
- No event edit/delete for now — phase 2.

**Blockers:**
- None

**Feature description:**
- 승인된 유저는 `/profile`에서 "Host a Meetup" 버튼으로 밋업을 생성할 수 있음. 생성된 밋업은 해당 유저의 `/people/[id]` 프로필에 "Hosting" 섹션으로 표시됨.
- 다른 유저는 이벤트 카드에서 "Request to join" 버튼으로 RSVP 신청 (선택적 메시지 포함).
- 호스트는 `/profile`에서 pending RSVP 목록을 보고 승인/거절 가능.
- 승인된 참가자에게만 "Meeting details" (세부 만남 장소 등) 공개.
