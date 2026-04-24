# Spec: Onboarding clean slate

**Goal:** Remove Google profile image auto-fill on signup so new users start onboarding with no photo.

**Scope:**
- In: `lib/auth.ts` — set `profileImage: null` instead of `user.image ?? null` (3 places)
- Out: existing users, onboarding UI, profile photo upload flow

**Completion criteria:**
- [ ] New users sign up with no profile image (Google photo not stored)
- [ ] Existing users' images are unaffected
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 new errors in modified files
