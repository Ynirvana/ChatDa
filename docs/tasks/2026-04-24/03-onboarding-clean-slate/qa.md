# QA: Onboarding clean slate

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

- [ ] 새 Google 계정으로 가입 시 온보딩 Photos 섹션이 비어있음
- [ ] 기존 유저 프로필 이미지 그대로 유지됨

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `lib/auth.ts`
**Key decisions:**
-
