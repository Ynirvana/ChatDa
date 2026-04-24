# QA: First Name / Last Name split

## Auto

```bash
npx tsc --noEmit
npm run lint
```

| Check | Expected | Result |
|---|---|---|
| TypeScript | 0 errors | ✅ |
| Lint (modified files) | 0 new errors | ✅ |

**Auto result: PASS**

## Manual (Human)

- [ ] 온보딩 폼에서 First name / Last name 두 필드가 보임
- [ ] 제출 후 People 탭에서 "First Last" 형태로 이름이 표시됨
- [ ] `/onboarding?edit=1`에서 기존 first_name/last_name이 pre-fill됨
- [ ] 둘 중 하나라도 비우면 제출 버튼이 비활성화됨

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `db/schema.ts`
- `backend/database.py`
- `backend/routers/users.py`
- `app/api/onboarding/complete/route.ts`
- `app/api/users/me/route.ts`
- `app/onboarding/OnboardingForm.tsx`
- `app/onboarding/page.tsx`
- `lib/server-api.ts`
**Key decisions:**
-
