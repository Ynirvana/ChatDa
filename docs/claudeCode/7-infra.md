# 7. Infrastructure

## Overview

Self-hosted single server behind Cloudflare Tunnel. Prod and dev run side-by-side on the same machine using separate Docker Compose stacks and separate Postgres databases.

```
[Browser]
    ↓ HTTPS
[Cloudflare Tunnel]  — tunnel label "chatcity" (DO NOT rename or touch ingress rules)
    ↓
[Ubuntu server — DESKTOP-CGQGH6P]
  Docker Compose (prod)  chatda-app :3001, chatda-backend :8000
  Docker Compose (dev)   chatda-app-dev :3000, chatda-backend-dev :8001
  Postgres               shared :5434 → chatda (prod) + chatda_dev (dev)
```

Live URL: **https://chatda.life**

---

## Server

| Item | Value |
|---|---|
| Hostname | DESKTOP-CGQGH6P |
| OS | Ubuntu (WSL2) |
| User | dykim |
| Project root | `/home/dykim/project/ChatDa` |
| Backups | `/home/dykim/project/ChatDa/backups/` (gitignored) |

⚠️ The same server also runs **chatcity.io** (separate live service, 500+ users). Never touch chatcity containers, ports, or Cloudflare ingress rules.

---

## Cloudflare Tunnel

- Tunnel label: `chatcity` (historical name — cannot be renamed without breaking chatcity.io)
- Config file: `/etc/cloudflared/config.yml`
- Routes `chatda.life` → `localhost:3001` (prod Next.js)
- **Never edit** ingress rules for chatcity — see `4-forbidden.md`

---

## Docker Compose Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Shared base — defines the `db` service only |
| `docker-compose.prod.yml` | Prod services: `app` (Next.js :3001) + `backend` (FastAPI :8000) |
| `docker-compose.dev.yml` | Dev services: `app-dev` (:3000) + `backend-dev` (:8001), hot-reload, volume mounts |

### Running prod

```bash
# Build + start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild a single service (e.g. after code change)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d app

# Logs
docker logs chatda-app --tail 50
docker logs chatda-backend --tail 50
```

### Running dev

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Container names

| Container | Stack | Port (host) |
|---|---|---|
| `chatda-app` | prod | 3001 |
| `chatda-backend` | prod | 8000 |
| `chatda-app-dev` | dev | 3000 |
| `chatda-backend-dev` | dev | 8001 |
| `chatda-db-1` | shared | 5434 |

---

## Postgres

Single container (`chatda-db-1`) serves two databases:

| Database | Used by |
|---|---|
| `chatda` | prod |
| `chatda_dev` | dev |

`chatda_dev` is created automatically by `db/init/01-create-dev-db.sql` on first volume init.

### Connecting directly

```bash
# Prod DB
docker exec -it chatda-db-1 psql -U chatda chatda

# Dev DB
docker exec -it chatda-db-1 psql -U chatda chatda_dev
```

---

## Dockerfiles

### Next.js (`Dockerfile` at repo root)

Three-stage build:
1. `deps` — `npm ci` only (reused by dev compose as base)
2. `builder` — full `npm run build` (standalone output)
3. `runner` — copies `.next/standalone`, static assets, public — minimal image

### FastAPI (`backend/Dockerfile`)

Single stage: `python:3.12-slim` → `pip install -r requirements.txt` → `uvicorn main:app --workers 2`

---

## DB Migrations

**Always follow this order — never skip steps:**

```
npm run db:generate     # generates SQL in drizzle/
# review the SQL manually
npm run db:migrate      # applies to chatda_dev
# verify on dev
bash scripts/backup-db.sh
bash scripts/migrate-prod.sh   # prompts for "APPLY" — run in your terminal
```

- `npm run db:generate` — Drizzle Kit reads `db/schema.ts`, writes `drizzle/NNNN_*.sql`
- `npm run db:migrate` — applies pending migrations to `chatda_dev` (reads `DATABASE_URL` from `.env.local`)
- `scripts/migrate-prod.sh` — loads `.env.production.local`, masks password, requires typing `APPLY`
- **Never edit** `drizzle/*.sql` by hand — breaks migration checksums
- **Never DROP** tables or run bulk DELETEs on prod without a backup

---

## Backups

```bash
bash scripts/backup-db.sh
```

- Output: `backups/chatda-YYYY-MM-DD-HHMM.sql.gz`
- Retention: 30 days (older files auto-deleted)
- Log: `backups/backup.log`
- Cron (daily 04:00 KST): `0 4 * * * /home/dykim/project/ChatDa/scripts/backup-db.sh`

### Restore

```bash
gunzip -c backups/chatda-2026-04-25-0000.sql.gz | \
  docker exec -i chatda-db-1 psql -U chatda chatda
```

---

## Env Files

| File | Used by |
|---|---|
| `.env.local` | Next.js dev (`chatda_dev`) |
| `.env.production.local` | Next.js prod (`chatda`) + migrate-prod.sh |
| `backend/.env.local` | FastAPI dev |
| `backend/.env.production` | FastAPI prod |

Never read or expose these files. If a new env var is needed, tell the user the key name and format — never fill in the value yourself. See `4-forbidden.md`.

---

## Deployment Checklist

When deploying code changes:

1. **Frontend only** (Next.js/components/pages):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache app
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d app
   ```

2. **Backend only** (FastAPI/routers/database models):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache backend
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
   ```

3. **Both** (e.g. new API endpoint + UI):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache app backend
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **DB schema change** — run migration before or after deploy depending on whether the change is additive (nullable column = safe to deploy first) or breaking.

Always verify after deploy:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep chatda
# Both chatda-app and chatda-backend should show (healthy)
```
