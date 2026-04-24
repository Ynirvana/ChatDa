# Language
Always write and think in English — all responses, comments, commit messages, and documentation.

# Keeping Docs in Sync
Whenever you change the DB schema or API routes, update the relevant doc in the same task — not later:
- `docs/claudeCode/5-schema.md` — any change to `db/schema.ts`
- `docs/claudeCode/6-api.md` — any new, modified, or deleted route in `app/api/` or `backend/routers/`

# Surgical Changes

When editing existing code:
- Every changed line must trace directly to what was asked. Don't improve adjacent code, formatting, or comments — even if you'd do it better.
- If you spot unrelated dead code, mention it. Don't delete it.
- Remove imports, variables, and functions that YOUR changes made unused. Leave pre-existing dead code alone — that's a separate task.

# Task Process — MANDATORY, NO EXCEPTIONS

Every feature or bug fix requires a task folder under `docs/tasks/NN-name/` with 3 files:
- `spec.md` — Goal, Scope, Completion criteria
- `status.md` — State, Work log, Decisions, Blockers
- `qa.md` — Auto checks, Manual checks, Summary

**Starting a new task:**
1. Create the task folder and fill in `spec.md` first
2. Confirm completion criteria with the user **before writing any code**
3. Implement, updating `status.md` work log after each meaningful change
4. Run auto QA (`npx tsc --noEmit`, `npm run lint`, task-specific checks) and fill in `qa.md`
5. Set state to `HUMAN_CHECK_PENDING` — do not mark `DONE` until the user confirms manual checks pass

**Starting a session on an existing task:**
1. Read `spec.md`, `status.md`, `qa.md` in the task folder
2. Run all auto QA commands and report results
3. Continue from the work log

**Task states:**

| State | Meaning |
|---|---|
| `IN_PROGRESS` | Being worked on |
| `HUMAN_CHECK_PENDING` | Auto QA passed — waiting for human verification |
| `CHANGES_REQUESTED` | Auto QA failed — needs fixes |
| `DONE` | Auto + manual both passed |

Template files are in `docs/tasks/00-template/`.

---

@docs/claudeCode/1-project.md
@docs/claudeCode/2-architecture.md
@docs/claudeCode/3-conventions.md
@docs/claudeCode/4-forbidden.md
@docs/claudeCode/5-schema.md
@docs/claudeCode/6-api.md
