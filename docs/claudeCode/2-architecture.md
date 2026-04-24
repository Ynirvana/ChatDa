# 2. Architecture

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend | Next.js App Router, standalone | 16.2.3 |
| UI | React | 19.2.4 |
| Backend | FastAPI (Python, uvicorn) | owns business logic |
| DB ORM (Next.js) | Drizzle ORM | 0.45.2 |
| DB ORM (FastAPI) | SQLAlchemy async | — |
| Database | PostgreSQL | 16 |
| Auth | NextAuth v5 beta | `^5.0.0-beta.30`, `trustHost: true` |
| Styling | Tailwind CSS v4 | CSS-first — no `tailwind.config.js` |
| ID generation | nanoid | all PKs (users.id, events.id, etc.) |
| TypeScript | strict mode | `"strict": true` in tsconfig.json |

---

## Port Map

| Service | Dev host | Prod host | Container |
|---|---|---|---|
| Next.js | 3000 | 3001 | 3000 |
| Backend | 8001 | 8000 | 8000 |
| Postgres | 5434 (shared) | 5434 (shared) | 5432 |
| **Live** | — | https://chatda.life | — |

---

## Infrastructure

```
[Browser]
    ↓ HTTPS
[Cloudflare Tunnel] — tunnel label "chatcity" (cannot rename)
    ↓
[Docker Compose — self-hosted]
  chatda-app      (Next.js)   prod:3001 / dev:3000
  chatda-backend  (FastAPI)   prod:8000 / dev:8001
  db              (Postgres)  shared 5434  →  two DBs: chatda (prod) + chatda_dev (dev)
```

⚠️ The same server runs chatcity.io (523 live users). Never touch its ingress rules in `/etc/cloudflared/config.yml` — see `4-forbidden.md`.

---

## Layer / Directory Structure

```
app/
  api/              Next.js API routes
                    Role: auth guard + payload mapping + proxyToBackend
                    Do NOT put business logic here — delegate to FastAPI
  [route]/          Page components
                    Default: Server Component
                    Add state/events: split into *Client.tsx

components/         Reusable React components (PascalCase.tsx)

db/
  schema.ts         Single Drizzle schema file — all tables and enums defined here
  drizzle/          Auto-generated migration SQL — never edit by hand

lib/
  auth.ts           NextAuth handlers + auth() — includes approval-flow branching
  proxy.ts          proxyToBackend() helper — used by almost every API route
  constants.ts      LOCATIONS, USER_STATUSES, PLATFORMS, GENDER_OPTIONS, KOREAN_UNIVERSITIES, etc.
  admin.ts          isAdminEmail() — reads ADMIN_EMAILS env var
  completeness.ts   Profile completeness score (7 fields)
  stay-duration.ts  Stay period parsing (Visiting / Living / Visited branches)
  invites.ts        Invite token generation and validation

backend/
  main.py           FastAPI entry point
  routers/          users, events, connections, rsvp, feed, host, memories, admin
  auth.py           JWT validation (NextAuth session → FastAPI auth)
  database.py       SQLAlchemy async client

public/
  sw.js             Service Worker (hand-written — see System Requirements)
  manifest.json     PWA manifest
  offline.html      Offline fallback

scripts/
  seed.ts           Test accounts (@chatda.test) + sample data
  migrate-prod.sh   Production migration script (requires typing APPLY)
```

---

## Data Flow

```
Browser
  → Next.js API route  (app/api/*/route.ts)
      ↓  auth() — verify session
      ↓  proxyToBackend() — hand off to FastAPI
  → FastAPI  (business logic)
      ↓  SQLAlchemy async
  → Postgres
```

**Exceptions — where Next.js queries Drizzle directly:**
- `lib/auth.ts` — insert new user, check banned emails (inside NextAuth signIn callback)
- `app/api/users/me/route.ts` — read approvalStatus to block pending users
- `app/api/admin/*` — admin panel queries

Everything else uses `proxyToBackend(req, '/path', 'METHOD', payload)`.

---

## Middleware

Next.js 16 renamed `middleware.ts` → **`proxy.ts`**.
Edit `proxy.ts` when touching middleware logic.
