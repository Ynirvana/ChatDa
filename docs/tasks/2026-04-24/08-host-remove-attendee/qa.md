# QA: Host can remove approved attendees

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

- [ ] `/profile` Hosting 섹션 → 승인된 참가자 "Going" 목록 보임
- [ ] Remove 버튼 클릭 → 참가자 목록에서 사라짐
- [ ] `/meetups/[id]` "Who's going" → 호스트로 접속 시 Remove 버튼 보임
- [ ] Remove 후 attendee 카드 사라짐 (router.refresh)
- [ ] 호스트 본인 카드에는 Remove 버튼 없음 (rsvpId 없음)

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `components/HostingSection.tsx`
- `components/AttendeeCard.tsx`
- `backend/routers/host.py`
- `app/api/host/rsvp/route.ts`
**Key decisions:**
-
