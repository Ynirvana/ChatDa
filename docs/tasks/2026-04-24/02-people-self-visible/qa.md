# QA: People tab — show self + Save redirects to /people

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

- [ ] /people에서 본인 카드가 보인다
- [ ] 본인 카드에 Connect 버튼 대신 "You" 뱃지가 표시된다
- [ ] Profile 페이지에서 변경 후 Save 누르면 /people로 이동한다
- [ ] 다른 유저 카드에는 Connect 버튼이 정상 표시된다
- [ ] 비로그인 유저에게는 영향 없음 (Sign up to connect → 정상)

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `backend/routers/users.py`
- `components/PersonCard.tsx`
- `app/people/PeopleClient.tsx`
- `app/people/page.tsx`
- `components/ProfileEditProvider.tsx`
**Key decisions:**
-
