# QA: Meetup Hosting

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

- [ ] `/profile`에 "Hosting" 섹션과 "+ Host a Meetup" 버튼이 보임
- [ ] 이벤트 생성 폼 필수 필드 비우면 "Create Meetup" 버튼 비활성화
- [ ] 이벤트 생성 후 목록에 나타남
- [ ] 다른 유저의 `/people/[id]`에서 Hosting 섹션 + 이벤트 카드 보임
- [ ] "Request to join" 클릭 → 메시지 입력 → Send → "Request sent"로 변경
- [ ] 호스트 `/profile`에서 pending RSVP 목록과 ✓/✕ 버튼 보임
- [ ] ✓ 승인 후 해당 참가자에게 "✓ You're in" 표시
- [ ] 승인 후 참가자가 이벤트 카드에서 "Meeting details" 섹션 볼 수 있음 (meeting_details 입력 시)
- [ ] 본인 프로필에서는 "Request to join" 버튼 없음

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `components/HostingSection.tsx`
- `app/people/[id]/EventRsvpButton.tsx`
- `app/profile/page.tsx`
- `app/people/[id]/page.tsx`
- `backend/routers/host.py`
- `backend/routers/users.py`
- `backend/routers/rsvp.py`
**Key decisions:**
-
