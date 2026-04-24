# 5. Task Management

## Core Principles

- Every feature = one task
- Claude Code resets every session → docs maintain context
- Define completion criteria **before** writing any code
- Auto verification and manual verification are separate
- Ship and iterate, not perfection

---

## Directory Structure

```
docs/tasks/
  00-template/task.md    copy this for every new task
  01-<name>/task.md
  02-<name>/task.md
  ...
```

Naming: two-digit sequence + kebab-case description. Examples: `01-people-filter`, `02-hosting-section`.

---

## Task States

| State | Meaning |
|---|---|
| `IN_PROGRESS` | Being worked on |
| `HUMAN_CHECK_PENDING` | Auto QA passed — waiting for human verification |
| `CHANGES_REQUESTED` | Auto QA failed — needs fixes |
| `DONE` | Auto + manual both passed |

**Decision logic:**
- Auto PASS + Manual PASS → `DONE`
- Auto PASS + Manual incomplete → `HUMAN_CHECK_PENDING`
- Auto FAIL → `CHANGES_REQUESTED`

---

## Auto vs Manual

**Auto — Claude runs these:**
- TypeScript type check
- API responses (curl / fetch)
- DB state queries
- Lint

**Manual — human runs these:**
- Layout and visual correctness
- Real device
- UX flow (does it feel right?)
- Tone and copy
- Accessibility

---

## Claude's Behavior

**Starting a session on an existing task:**
1. Read the task's `task.md`
2. Run all QA List commands
3. Report results
4. Continue from the work log

**Starting a new task:**
1. Fill in the entire Spec section first
2. Confirm completion criteria with the user before writing any code
3. Then implement
4. Update the work log after each meaningful change
5. Run QA List when implementation is complete
6. Write the Summary only when state reaches `DONE`
