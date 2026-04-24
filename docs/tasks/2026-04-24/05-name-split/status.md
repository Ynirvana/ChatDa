# Status: First Name / Last Name split

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Implemented — DB schema, migration (dev + prod), backend, API route, onboarding form. TypeScript clean.

**Decisions:**
- `name` 컬럼 유지 — always synced to `first_name + " " + last_name`. 기존 쿼리/display 변경 없음.
- 기존 유저(더미 데이터) 무시 — first_name/last_name null, name 기존 값 유지.
- PATCH /users/me에서도 first_name/last_name 업데이트 가능 — profile edit 지원.

**Blockers:**
- None

**Feature description:**
- 온보딩 시 이름을 First name / Last name 두 필드로 따로 입력받음. 저장 시 `name = first_name + " " + last_name`으로 자동 합산. 기존 앱 전체에서 `name` 필드를 그대로 사용하므로 표시 방식은 변경 없음.
