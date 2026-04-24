# Status: Meetup contact link

**State:** HUMAN_CHECK_PENDING

## Feature description

Host can optionally add a group chat link (KakaoTalk open chat, WhatsApp group, etc.) when creating or editing a meetup. The link is shown on the meetup detail page exclusively to the host and approved attendees — a "Join →" button that opens the URL. Non-approved and logged-out visitors never see it.

## Work log

- `db/schema.ts` — added `contactLink: text('contact_link')` to events table
- `drizzle/0028_futuristic_tyger_tiger.sql` — generated: `ALTER TABLE "events" ADD COLUMN "contact_link" text`
- Dev migration applied
- `backend/database.py` — `contact_link` mapped column added to Event model
- `backend/routers/host.py` — `contact_link` field in `CreateEventBody`; saved on create and update
- `backend/routers/events.py` — `contact_link` in `EventDetailOut`; returned in GET /events/:id response
- `lib/server-api.ts` — `contact_link` added to `ApiEventDetail`
- `components/HostingSection.tsx` — `contact_link` in form state + POST payload + UI input field
- `components/host/CreateEventForm.tsx` — `contactLink` in initial type + form state + PATCH payload + UI input field
- `app/host/events/[id]/edit/page.tsx` — `contactLink: event.contact_link` passed to form initial
- `app/meetups/[id]/page.tsx` — "Group chat" section rendered when `event.contact_link` exists and viewer is host or approved attendee
- Deployed (prod build healthy, prod DB migration pending)
