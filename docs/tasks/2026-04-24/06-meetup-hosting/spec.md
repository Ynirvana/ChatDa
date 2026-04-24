# Spec: Meetup Hosting

**Goal:** Any approved user can host meetups from their profile. Other users browse hosted events on the host's public profile and send RSVP requests. Host approves/rejects from their own profile.

**Scope — IN:**
- `/profile`: "Host a Meetup" button → inline creation form
- `/profile`: host's upcoming event list + pending RSVP list per event + approve/reject
- `/people/[id]`: Hosting section (was hidden) — upcoming events with "Request to join" button + optional message
- Event fields: title, date, time, area, naver_map_url, google_map_url, capacity, fee (0 = free), description, meeting_details (approved attendees only)
- Approved attendees see meeting_details on the host's profile event card

**Scope — OUT:**
- Cover image upload
- Past events display
- Dedicated `/meetups` page
- Comments
- Event edit / delete (phase 2)

**Completion criteria:**
- [ ] Any approved user can create an event from `/profile`
- [ ] Created events appear in host's upcoming list on `/profile`
- [ ] Pending RSVPs shown per event on `/profile`; host can approve or reject
- [ ] `/people/[id]` Hosting section shows upcoming events (date >= today)
- [ ] Logged-in approved user can send RSVP request (+ optional message) from `/people/[id]`
- [ ] Already-pending/approved RSVP shows correct status (no duplicate request)
- [ ] Approved attendees see `meeting_details` on the event card
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 new errors in modified files
