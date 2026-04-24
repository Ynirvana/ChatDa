# Status: Onboarding clean slate

| | |
|---|---|
| **State** | `HUMAN_CHECK_PENDING` |
| **Created** | 2026-04-24 |
| **Updated** | 2026-04-24 |

**Work log** (newest first):
- 2026-04-24: Fix 2 — removed `googleImage` prop from `OnboardingForm` and the `if (googleImage)` initializer. Root cause was that onboarding was using `session.user.image` (Google OAuth) directly, independent of the DB value.
- 2026-04-24: Fix 1 — replaced `user.image ?? null` with `null` in all 3 insert locations in `lib/auth.ts`. TypeScript clean. (Incomplete — onboarding still used session image)

**Decisions:**
- `replace_all` 사용 — 3곳 모두 동일한 패턴이라 일괄 교체.
- 기존 유저 데이터 변경 없음 — auth.ts 변경은 신규 가입 시점에만 영향.

**Blockers:**
- None

**Feature description:**
- 신규 가입 시 Google 프로필 사진이 자동으로 저장되지 않음. 온보딩을 빈 상태(사진 없음)로 시작하게 됨.
