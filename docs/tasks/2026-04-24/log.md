# 2026-04-24 Changes

- Own social links visible on own profile page (isMe bypasses "Connect to see links" lock)
- KakaoTalk and WhatsApp added to PLATFORMS constant (icons already existed, just missing from UI list)
- Share button added to event cards in /profile and /people/[id] — copies chatda.life/meetups/[id] link (mobile: native share sheet)
- Removed social link requirement from profile view gate (social links are now fully optional)
- Event cards on /people/[id] are now clickable — navigate to /meetups/[id] (title/date/spots area is the Link; map links and buttons are separate below)
- EventRsvpButton: removed message input, sends request directly on single button click
- /people/[id] page: added revalidate=0 so spots/approved count always shows fresh data
- Hosting card in /profile now clickable (title/date area links to /meetups/[id])
- going count now includes host (+1): display shows (approved+1)/capacity in HostingSection and /people/[id]; /meetups/[id] already had host included from backend (fixed double-count bug)
- /meetups/[id] "Who's going" shows Remove button for host; AttendeeCard receives rsvp_id from backend
- Fixed Remove not working: /api/host/rsvp route was blocking 'cancelled' status (only allowed approved/rejected)
- /meetups/[id] bottom bar now fades in only when near the bottom of the page (scroll-based opacity), invisible when scrolling up — no more overlap with content
- RSVP re-apply fix: cancelled/rejected users can now re-send request (reuses existing DB row, resets to pending)
- Who's going: host now shown first in the attendee list
- AttendeeCard: platform emoji → PlatformIcon component (proper icons)
- AttendeeCard: name/avatar area is a Link to /people/[id]
- Meetup page: non-logged-in guests see host photo blurred + social links hidden, replaced with "Sign in to see full profile →" CTA
- Cover image upload added to meetup creation form (optional, base64, shows preview with remove button)
- Cover image paste (Ctrl+V) added to both HostingSection create form and CreateEventForm (edit page)
- Edit meetup page converted from dark to light theme (CreateEventForm + page.tsx)
- Meetup photo: removed full-width hero image, now shown naturally inside About section (max-height 400px, rounded corners)
- Photo label changed from "Cover image/photo" to "Photo (shows what the meetup is like)"
- Date/Time inputs: added colorScheme:light to show native calendar/clock picker properly

- Profile Save button redirects to /people instead of refreshing in place
- Show viewer's own card in People directory (with "You" badge instead of Connect button)
- Removed Google profile image auto-fill on signup (auth.ts + OnboardingForm)
- Removed "Quick note" banner from onboarding form
- "Complete profile →" button on /people/[id] goes to /profile, not /onboarding
- Prevent Connect button from showing on own profile page (/people/[id])
- "Share ChatDa" section removed from profile page
- Social links excluded from completeness score (remain optional)
- Profile view gate: requires completeness 100% + at least 1 social link; separate banners for each failure case

- DB backup location moved from ~/chatda-backups/ to project-local backups/ (gitignored); scripts/backup-db.sh updated
