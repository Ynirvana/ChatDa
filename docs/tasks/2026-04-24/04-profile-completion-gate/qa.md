# QA: Profile completion gate

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

- [ ] 프로필 미완성 유저가 `/people/[id]` 접근 시 `/profile?incomplete=1`으로 redirect됨
- [ ] `/profile?incomplete=1` 배너가 상단에 표시됨
- [ ] 프로필 100% 완성 유저는 `/people/[id]` 정상 열람 가능
- [ ] 비로그인 유저는 기존 동작 그대로 (영향 없음)

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `app/people/[id]/page.tsx`
- `app/profile/page.tsx`
- `lib/completeness.ts` (기존 로직 재사용)
**Key decisions:**
-
