# Spec: Meetup contact link

**Goal:** Host adds an optional group chat link (open KakaoTalk, WhatsApp group, etc.) when creating/editing a meetup — shown only to approved attendees after RSVP approval.

**Scope:**
- In: `contact_link` field on events table; input in create + edit form; display on `/meetups/[id]` for approved attendees and host
- Out: validation of URL format, in-app messaging, showing on `/people/[id]` event cards

**Completion criteria:**
- [ ] DB: `contact_link` column added to `events` table (nullable text)
- [ ] Host can enter a link when creating a meetup (HostingSection)
- [ ] Host can enter/edit a link when editing a meetup (CreateEventForm)
- [ ] `/meetups/[id]`: approved attendees and host see a "Join group chat →" button linking to the URL
- [ ] Non-approved / logged-out users do not see the link
