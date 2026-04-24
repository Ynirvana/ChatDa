# QA: Meetup contact link

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

- [ ] Create meetup — "Group chat link" input visible in HostingSection form
- [ ] Save meetup with a link → visible on `/meetups/[id]` as "Group chat" section
- [ ] Approved attendee sees "Join →" button linking to the URL
- [ ] Non-approved / logged-out user does NOT see the link
- [ ] Edit meetup — link pre-filled and saves correctly
- [ ] Leave field blank → no group chat section shown

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `db/schema.ts`
- `drizzle/0028_futuristic_tyger_tiger.sql`
- `backend/database.py`
- `backend/routers/host.py`
- `backend/routers/events.py`
- `components/HostingSection.tsx`
- `components/host/CreateEventForm.tsx`
- `app/meetups/[id]/page.tsx`
**Key decisions:**
- Group chat link shown only to approved attendees + host — non-approved users can't see it even if logged in
