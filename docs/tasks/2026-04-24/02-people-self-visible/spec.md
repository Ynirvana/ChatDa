# Spec: People tab — show self + Save redirects to /people

**Goal:** Two small UX fixes: (1) logged-in users can see their own card in the People tab, (2) saving profile redirects to /people instead of staying on the profile page.

**Scope:**
- In: remove self-exclusion from `/users/directory`, add "You" badge to own card, redirect after Save
- Out: any changes to PersonCard visual design, connection flow, onboarding

**Completion criteria:**
- [x] Logged-in user sees their own card in `/people`
- [x] Own card shows "You" label instead of Connect button
- [x] Saving profile redirects to `/people`
- [x] TypeScript: 0 errors
- [x] Lint: 0 new errors in modified files
