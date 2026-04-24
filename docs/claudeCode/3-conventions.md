# 3. Conventions

## Code Style

### File Naming

| Kind | Rule | Example |
|---|---|---|
| React component | PascalCase.tsx | `PersonCard.tsx`, `FilterSelect.tsx` |
| Page (Server Component) | `page.tsx` (App Router fixed) | `app/people/page.tsx` |
| Client split | `*Client.tsx` | `app/people/PeopleClient.tsx` |
| Lib / utility | camelCase.ts | `auth.ts`, `serverApi.ts` |
| API route | `route.ts` (App Router fixed) | `app/api/users/me/route.ts` |
| Folder | kebab-case | `app/pending-approval/` |

### Naming Conventions

- **Be specific.** `getUserApprovalStatus` beats `getStatus`. `PeopleFilterPanel` beats `Panel`.
- **No abbreviations** unless universally understood (`id`, `url`, `db`).
- **Booleans** should read as statements: `isApproved`, `hasProfileImage`, `canConnect`.
- **Event handlers** are prefixed `handle`: `handleSubmit`, `handleFilterChange`.

### TS ↔ Python/DB Boundary

TypeScript uses camelCase. DB columns and FastAPI use snake_case.
Convert at the API route layer — nowhere else:

```typescript
// app/api/users/me/route.ts
if ('stayArrived' in body) payload.stay_arrived = body.stayArrived ?? null;
if ('lookingFor' in body)  payload.looking_for  = body.lookingFor  ?? [];
```

### Imports

- Always use `@/` alias — minimize `../` relative paths
- Constants always come from `@/lib/constants` — no inline magic strings or numbers

### Server vs Client Component

- Default to Server Component
- Add `'use client'` only when you need state, effects, or event handlers — split into `*Client.tsx`
- `useRouter`, `useSearchParams` are Client-only

---

## Clean Code

### Functions do one thing

Each function, component, and API route handler should have a single clear responsibility.
If you need "and" to describe what it does, split it.

```typescript
// ❌ does too much
async function saveProfileAndNotifyAdmin(data) { ... }

// ✅ each does one thing
async function saveProfile(data) { ... }
async function notifyAdmin(userId) { ... }
```

### Keep functions short

If a function doesn't fit on one screen, it's doing too much.
Extract named helper functions rather than adding more lines.

### No comments explaining WHAT — only WHY

Well-named code explains itself. Comments exist only for non-obvious constraints or workarounds.

```typescript
// ❌ states the obvious
// check if user is approved
if (user.approvalStatus === 'approved') { ... }

// ✅ explains a non-obvious decision
// Pending users can still edit profile before resubmitting — only block approved actions
if (user.approvalStatus === 'pending') return forbidden();
```

### No magic values

All constants belong in `lib/constants.ts`. Never inline strings or numbers that have domain meaning.

```typescript
// ❌
if (images.length > 5) ...
if (status === 'exchange_student') ...

// ✅
if (images.length > MAX_PROFILE_IMAGES) ...
if (status === USER_STATUSES.student.id) ...
```

### Don't add code for hypothetical futures

Build what's needed now. Three similar lines is better than a premature abstraction.
No half-finished implementations, no feature flags for things that don't exist yet.

### Components: one concern

A component should render one piece of UI. If it's fetching data, transforming it, and rendering, break it up.
Extract reusable pieces to `components/` only when the same UI appears in two or more places.

---

## Error Handling

### API Route Pattern

```typescript
// Auth check — top of every protected route
const session = await auth();
if (!session?.user?.id)
  return Response.json({ error: 'Unauthorized' }, { status: 401 });

// Business logic guard
if (someCondition)
  return Response.json({ error: 'Descriptive reason' }, { status: 403 });

// Delegate to FastAPI — errors are relayed as-is
return proxyToBackend(req, '/path', 'POST', payload);
```

Error messages should be specific enough to debug, not expose internals.

### Client Pattern

```typescript
const res = await fetch('/api/...');
if (!res.ok) throw new Error(await res.text());
```

No error boundaries yet — use page-level try/catch.

### FastAPI Errors

FastAPI `HTTPException` → `proxyToBackend` forwards the status code unchanged.
Check `docker logs chatda-backend` for 500s.

---

## Type Policy

- `strict: true` — no `any`. When type is truly unknown, use `unknown` + type guard.
- API body types: define inline `interface Body { ... }` at the top of the route file.
- DB types: use Drizzle inference — don't duplicate manually.

```typescript
import { InferSelectModel } from 'drizzle-orm';
type User = InferSelectModel<typeof users>;
```

- NextAuth session type extensions live in `types/next-auth.d.ts`.
- Use `as const` on constant arrays (follow the pattern in `lib/constants.ts`).

---

## Git Convention

### Commit Messages

Conventional Commits: `type(scope): message`

| type | use |
|---|---|
| `feat` | new feature |
| `fix` | bug fix |
| `refactor` | restructure without behavior change |
| `chore` | build, config, seed, infra |
| `docs` | documentation only |
| `perf` | performance improvement |
| `style` | formatting, lint (no logic change) |

Scope examples: `profile`, `people`, `admin`, `infra`, `seed`

```
feat(people): add nationality filter to People tab
fix(profile): always show Save button + auto-save pending language entries
chore(seed): include @chatda.test accounts in prod /people for MVP bootstrap
refactor(profile): replace per-field save with single bottom Save button
```

### Atomic Commits

One commit = one logical change. Don't bundle unrelated fixes into a single commit.
If the commit message needs "and", it should probably be two commits.

```
// ❌ too much in one commit
feat(profile): add bio editor, fix avatar upload, update nav colors

// ✅ each commit is independently understandable
feat(profile): add inline bio editor
fix(profile): correct avatar upload on slow connections
style(nav): update active tab color to match new palette
```

Never commit broken code. Every commit on `main` should be in a working state.

### Branch Naming

```
feat/people-filter       new feature
fix/profile-save-button  bug fix
chore/update-seed-data   maintenance
```

### When to Add a Commit Body

Subject line alone is enough for most commits.
Add a body only when the **why** isn't obvious from the diff:

```
fix(auth): block pending users from PATCH /users/me

Pending users were able to update their profile after submission,
which caused their approval snapshot to drift from what the admin reviewed.
```
