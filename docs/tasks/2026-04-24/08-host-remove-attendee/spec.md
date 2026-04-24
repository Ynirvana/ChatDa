# Spec: Host can remove approved attendees

**Goal:** Host can cancel/remove an attendee who was already approved, from the event card in /profile.

**Scope:**
- In: `PATCH /host/rsvp` accepts `cancelled` status, `GET /host/events` returns approved attendees, HostingSection shows approved attendees with Remove button
- Out: notification to removed attendee, event page attendee list (already reflects DB)

**Completion criteria:**
- [ ] `PATCH /host/rsvp` accepts `cancelled` as valid status
- [ ] `GET /host/events` returns `approved_rsvps` list per event (user name + image)
- [ ] HostingSection shows approved attendees under each event card
- [ ] Host can click Remove → attendee status set to `cancelled`
- [ ] TypeScript: 0 errors
