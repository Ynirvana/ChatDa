# 1. Project

## Product Overview

A platform for foreigners in Korea to meet people.

### 3 Hypotheses to Validate

1. Foreigners are lonely. They want to go out and meet people. → Validate via meetups
2. Foreigners are curious about what other foreigners are around them. → Validate via profile browsing
3. Foreigners want to meet Koreans too. → Validate via meetups

Validation approach: attend a foreigners' hiking meetup → build rapport with the host → introduce ChatDa.

### Product Structure

- **One tab: People** (the core)
- No separate Meetups tab — meetups are shown as a **Hosting section inside profiles**
- Meetups tab gets built when there are enough meetups to warrant it
- Hosts are admin-approved only (initially)

**Rule for every feature decision: "Does this help people find and connect with each other?"**

---

## System Requirements

### Concurrency

Early MVP — no dedicated scaling. Target: up to ~100 concurrent users on a single Postgres instance without connection pool tuning. This is acceptable for now; revisit when traffic grows.

Avoid N+1 queries — especially on the People list (users + socialLinks JOIN).

### PWA

**PWA support is mandatory.** Users must be able to install the app and get an offline fallback.

Hand-written implementation — next-pwa is not used.

| File | Role |
|---|---|
| `public/sw.js` | Service Worker — cache-first for static assets, network-first for HTML pages, API routes never cached |
| `public/manifest.json` | PWA manifest |
| `public/offline.html` | Offline fallback page |
| `components/ServiceWorkerRegistration.tsx` | SW registration component |

To change PWA behavior, edit `public/sw.js` directly.

### Performance

Target: Lighthouse 90+. No hard SLA beyond that for now.

### Auth

Google OAuth only. No passwords, no email verification.
Test accounts:
- `dykim9304@gmail.com` — admin

### Images

`profileImages` array, max 5. `profileImage` must always equal `profileImages[0]` — keep both fields in sync.
