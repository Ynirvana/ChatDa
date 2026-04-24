# QA: Meetup page light theme

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

- [ ] `/meetups/[id]` 페이지가 light background로 표시됨
- [ ] 카드, 텍스트, 버튼 모두 light theme 색상 적용
- [ ] "Who's going" AttendeeCard light 스타일
- [ ] 하단 fixed bar light 스타일
- [ ] Edit meetup 페이지 light theme

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `app/meetups/[id]/page.tsx`
- `components/RsvpButton.tsx`
- `components/host/RsvpActions.tsx`
- `components/AttendeeCard.tsx`
- `components/ShareButton.tsx`
- `app/host/events/[id]/edit/page.tsx`
- `components/host/CreateEventForm.tsx`
**Key decisions:**
-
