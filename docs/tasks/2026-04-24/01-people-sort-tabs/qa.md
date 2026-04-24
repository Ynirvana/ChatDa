# QA: People tab — 3 sort tabs + name search

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

- [ ] "Recently joined" tab — shows users in correct order
- [ ] "New arrivals" tab — sorts by arrival date, most recent first
- [ ] "Hosting" tab — shows only users with upcoming events; empty state shows correct message
- [ ] Name search filters correctly within the active tab
- [ ] Tab switching is instant (no flicker/reload)
- [ ] Looks correct on mobile
- [ ] Awaiting-approval blur/ghost logic still works
- [ ] Unauthenticated peek + CTA still works

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `app/people/PeopleClient.tsx`
- `backend/routers/users.py`
- `components/PersonCard.tsx`
**Key decisions:**
-
