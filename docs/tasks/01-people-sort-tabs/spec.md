# Spec: People tab — 3 sort tabs + name search

**Goal:** Replace the 7-filter panel on the People tab with 3 sort tabs (Recently joined / New arrivals / Hosting) and a name-only search bar, simplifying the UI and surfacing the most useful ways to browse.

**Scope:**
- In: sort tabs, name search, backend `created_at` + `is_hosting` fields, `PersonData` interface update
- Out: pagination, server-side filtering, any changes to PersonCard rendering, connection flow

**Completion criteria:**
- [x] "Recently joined" tab: sorts by `created_at DESC`
- [x] "New arrivals" tab: sorts by `stay_arrived DESC`, nulls last
- [x] "Hosting" tab: filters to `is_hosting === true`
- [x] Name search applies on top of active tab
- [x] All 7 filter states and filter panel removed
- [x] Backend returns `created_at` and `is_hosting` in `/users/directory`
- [x] TypeScript: 0 errors
- [x] Lint: 0 new errors in modified files
