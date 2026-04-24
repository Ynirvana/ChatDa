# Spec: First Name / Last Name split

**Goal:** Replace the single `name` field with separate `first_name` and `last_name` columns in the DB. Onboarding and profile edit collect them separately; display name throughout the app stays `first_name + " " + last_name`.

**Scope:**
- In: DB schema (`first_name`, `last_name` columns), Drizzle migration, backend (`users.py`), onboarding form, profile edit (onboarding?edit=1), `name` column kept as synced display name
- Out: PersonCard display format, people directory sort (still sorts by `name`)

**Key decision — existing `name` column:**
Keep `name` as a synced field (always = `first_name + " " + last_name`) for backwards compatibility — all existing queries/display using `name` continue to work unchanged.

**Existing users:**
`first_name` and `last_name` will be null initially. `name` retains existing value. Users update via profile edit next time they visit.

**Completion criteria:**
- [ ] `first_name text`, `last_name text` columns added to `users` table in `db/schema.ts`
- [ ] Drizzle migration generated and applied to dev DB
- [ ] Backend `PATCH /users/me` accepts `first_name` + `last_name`, writes both + syncs `name = first_name + " " + last_name`
- [ ] Backend `/users/me` GET returns `first_name` and `last_name`
- [ ] Onboarding form: "Display name" → two fields "First name *" + "Last name *"
- [ ] Profile edit (`/onboarding?edit=1`) shows same two fields, pre-filled
- [ ] `docs/claudeCode/5-schema.md` updated
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 new errors in modified files
