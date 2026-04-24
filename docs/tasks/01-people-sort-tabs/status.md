# Status: People tab — 3 sort tabs + name search

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — backend + frontend + PersonData interface. TypeScript clean, lint clean on modified files.

**Decisions:**
- Sort is client-side — data already fetched in full, no re-fetch on tab switch.
- `is_hosting`: one extra DB query per directory load (`events.date >= today` YYYY-MM-DD string comparison).
- "Hosting" empty state has its own message ("No one hosting right now") to set expectations.
- `created_at` added to backend response so client-side `recently_joined` sort is explicit, not dependent on backend order.

**Blockers:**
- None
