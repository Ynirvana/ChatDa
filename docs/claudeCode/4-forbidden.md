# 4. Forbidden

## Never read or expose `.env` files

All `.env*` files — `.env`, `.env.local`, `.env.production.local`, `backend/.env*`, etc.:
- Never read with `cat`, `head`, `tail`, or the Read tool
- Never modify
- Never `grep` for secret value patterns inside them

**Why:** Once a secret appears in a conversation log, it's considered leaked. Rotation is costly and risky.

What's allowed:
- `ls .env.local` — checking existence only
- Reading/editing `.env.example` — it has no real secrets
- If a new env var is needed: tell the user the key name and expected format, let them fill in the value


---

## Never run DB migrations without confirmation

Required order — never skip steps:

```
db:generate → review SQL → db:migrate (dev) → verify → backup → db:migrate:prod
```

- `db:migrate` targets `chatda_dev`
- `db:migrate:prod` targets `chatda` — user must run it in their terminal (requires typing `APPLY`)
- Never edit `db/drizzle/*.sql` files by hand — breaks migration checksums

Never DROP tables or run bulk DELETEs on the prod DB (`chatda`).
Always validate on dev (`chatda_dev`) first.
No destructive DB operations without a backup.

---

## Never touch chatcity (separate live service on the same server)

A separate live service (523 users) runs on the same server.

- Do not modify chatcity ingress rules in `/etc/cloudflared/config.yml`
- Do not change chatcity container config or ports
- Do not touch any `chatcity*` files in the codebase

---

## Git

- No `git push --force origin main` — destroys history
- No `--no-verify` — if a hook fails, fix the root cause
- No amend + force push on already-pushed commits

---

## Packages

If the existing stack (Tailwind, Drizzle, NextAuth, nanoid) can handle it, don't install a new package.
When a new package is genuinely needed, confirm with the user first.

---

## File deletion

Don't delete unverified files. Before removing anything in `docs/`, `scripts/`, or `public/`, confirm it's actually unused.
