# Spec: Profile completion gate

**Goal:** Require 100% profile completeness to view other users' individual profiles at `/people/[id]`.

**Scope:**
- In: `/people/[id]` page — redirect to `/profile` if viewer's completeness < 100%
- Out: `/people` directory listing, connect flow, unauthenticated access

**Completion criteria:**
- [ ] Logged-in user with incomplete profile is redirected to `/profile` when accessing `/people/[id]`
- [ ] Redirect includes a query param or message explaining why (e.g. `?incomplete=1`)
- [ ] `/profile` page shows a banner when `?incomplete=1` is present
- [ ] Fully complete users can view `/people/[id]` as before
- [ ] Unauthenticated users hit existing auth redirect (unaffected)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 new errors in modified files
