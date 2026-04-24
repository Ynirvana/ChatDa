# 2026-04-25 Changes

- Prod DB migration applied: events.contact_link column (task 10 from 2026-04-24)
- DB backup location moved from ~/chatda-backups/ to project-local backups/ (gitignored); scripts/backup-db.sh updated
- Pending request cards on /meetups/[id]: name/avatar area is now a Link to /people/[id]
- Contact link button label: "Join →" → "DM →" (page section) and "Join chat" → "DM" (bottom bar)
- ShareButton: always copies URL to clipboard (removed native share sheet); fallback to navigator.share if clipboard throws
- MeetupBottomBar: fixed both buttons being unclickable — content div (position:relative, zIndex:1, padding-bottom:80px) was intercepting taps over the fixed bar; fixed by adding zIndex:50 to the bar
- MeetupBottomBar: replaced pointerEvents toggle with visibility + delayed transition so buttons don't become un-tappable mid-fade
- docs/claudeCode/7-infra.md created — server, Cloudflare, Docker Compose, Postgres, migrations, backups, deployment checklist
- CLAUDE.md: added @docs/claudeCode/7-infra.md reference
