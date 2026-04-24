# 6. Database Schema

Source of truth: `db/schema.ts`. This file is the single place all tables and enums are defined.

---

## Enums

```
platform          linkedin | instagram | x | tiktok | snapchat | whatsapp | kakao | facebook | threads
rsvp_status       pending | approved | rejected | cancelled
tag_category      can_do | looking_for
connection_status pending | accepted | rejected
```

`user_status` enum was dropped in v4 — user status is now app-level validation via `USER_STATUSES` in `lib/constants.ts`.

---

## Tables

### users
Core table. One row per registered user.

| Column | Type | Notes |
|---|---|---|
| id | text PK | nanoid |
| name | text | display name |
| email | text unique | |
| googleId | text unique | from OAuth |
| nationality | text | ISO country name |
| location | text | one of `LOCATIONS` (14 regions) |
| locationDistrict | text | Seoul only — one of 25 gu |
| school | text | required when status = `exchange_student` |
| gender | text | `male` \| `female` \| `other` |
| age | integer | 18–99, optional |
| showPersonalInfo | boolean | false = hide age/gender from other users |
| bio | text | max 100 chars |
| profileImage | text | always = `profileImages[0]` — keep in sync |
| profileImages | text[] | max 5, first is primary |
| status | text | `exchange_student` \| `visitor` \| `expat` \| `local` (legacy ids — see USER_STATUSES) |
| countryOfResidence | text | default `KR` |
| lookingFor | text[] | tag ids |
| lookingForCustom | text | free-text extension of lookingFor |
| stayArrived | date | YYYY-MM-DD |
| stayDeparted | date | YYYY-MM-DD, Visiting/Visited only |
| languages | jsonb | `{ language: string, level: string }[]` |
| interests | text[] | preset ids |
| onboardingComplete | boolean | |
| approvalStatus | text | `pending` \| `approved` \| `rejected` |
| approvedAt / approvedBy | timestamp / text | |
| rejectionReason / rejectedAt | text / timestamp | |
| createdAt | timestamp | |

### approvalHistory
Audit log for every approval action. Used to give context when a user resubmits.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| userId | text FK → users | cascade delete |
| action | text | `submitted` \| `approved` \| `rejected` \| `resubmitted` |
| reason | text | rejection reason only |
| actorEmail | text | admin email, or user email for self-submissions |
| createdAt | timestamp | |

### socialLinks
One row per platform per user. Only visible to connected users.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| userId | text FK → users | cascade delete |
| platform | enum | platform values |
| url | text | |

### connections
Friend request system (1촌).

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| requesterId | text FK → users | |
| recipientId | text FK → users | |
| status | enum | `pending` \| `accepted` \| `rejected` |
| createdAt | timestamp | |

### userTags
`can_do` and `looking_for` tags. Max 3 per category (enforced app-level).

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| userId | text FK → users | cascade delete |
| tag | text | preset id or custom text |
| category | enum | `can_do` \| `looking_for` |

### events
Meetups. Hosted by admin-approved hosts only (initially).

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| title, date, time, endTime | text | date = YYYY-MM-DD, time = HH:MM |
| location, area | text | |
| capacity | integer | |
| fee | integer | KRW, display only |
| hostId | text FK → users | |
| coverImage, description | text | |
| googleMapUrl, naverMapUrl, directions | text | |
| requirements | text | JSON array e.g. `["profile_photo"]` |
| paymentMethod | text | `dutch` \| `split` \| `cover` \| `included` |
| feeNote | text | |
| createdAt | timestamp | |

### rsvps
Request to join an event. Host approves/rejects.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| eventId | text FK → events | cascade delete |
| userId | text FK → users | cascade delete |
| status | enum | rsvp_status |
| message | text | optional note to host |
| createdAt | timestamp | |

### inviteTokens
Single-use invite links issued by admin.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| token | text unique | |
| inviteNumber | serial | auto-increment, shown as "Invite #47" |
| createdByUserId | text FK → users | set null on delete |
| expiresAt | timestamp | |
| claimedByUserId | text FK → users | set null on delete |
| claimedAt | timestamp | |
| note | text | e.g. "Sarah from Yonsei" |

### bannedEmails
Blocked emails. Ban is separate from account deletion — email persists after account removal.

| Column | Type | Notes |
|---|---|---|
| email | text PK | |
| bannedAt | timestamp | |
| bannedBy / reason | text | |

### posts / postComments / postLikes
Feed system. Not surfaced in current MVP (no Feed tab).

### eventMemories
Post-event photos/reviews from attendees. Attached to events.

---

## Key Rules

- `profileImage` must always equal `profileImages[0]` — update both together
- `user_status` values in DB use legacy ids (`exchange_student`, `visitor`, `expat`) — render via `USER_STATUSES` in `lib/constants.ts`
- Tags: max 3 per category — enforced app-level, not DB constraint
- All PKs are nanoid strings except `approvalHistory.id` (serial) and `inviteTokens.inviteNumber` (serial)

---

## Drizzle Usage Patterns

```typescript
import { db } from '@/db';
import { users, connections } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

// Type inference
type User = InferSelectModel<typeof users>;

// Select
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

// Insert
await db.insert(users).values({ id: nanoid(), name: '...', email: '...' });

// Update
await db.update(users).set({ approvalStatus: 'approved' }).where(eq(users.id, id));

// Delete
await db.delete(connections).where(eq(connections.id, id));
```
