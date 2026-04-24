# Spec: Meetup page light theme

**Goal:** Convert `/meetups/[id]` from dark theme to light theme to match the rest of the site (/people, /profile).

**Scope:**
- In: `app/meetups/[id]/page.tsx`, `components/RsvpButton.tsx`, `components/host/RsvpActions.tsx`, `components/AttendeeCard.tsx`
- Out: page structure/layout, functionality, `/meetups/page.tsx`

**Completion criteria:**
- [ ] Meetup page uses light background and dark text (matches /people, /profile)
- [ ] All cards, dividers, and text use light-theme colors
- [ ] Bottom bar is light-themed
- [ ] RsvpButton, RsvpActions, AttendeeCard all look correct on light background
- [ ] TypeScript: 0 errors
