# 7. API Routes

Two layers: Next.js API routes (`app/api/`) and FastAPI (`backend/routers/`).

Next.js routes handle auth + payload mapping, then delegate to FastAPI via `proxyToBackend()`.
Exception: auth-layer routes query Drizzle directly — see `2-architecture.md`.

---

## Next.js API Routes

### Auth
| Route | Method | Notes |
|---|---|---|
| `/api/auth/[...nextauth]` | GET / POST | NextAuth handler — Google OAuth, session |

### Users
| Route | Method | Notes |
|---|---|---|
| `/api/users/me` | PATCH | Update profile. Blocks pending users. Transforms camelCase → snake_case before proxying |
| `/api/users/tags` | GET / POST / DELETE | User tags (can_do / looking_for) |

### Connections
| Route | Method | Notes |
|---|---|---|
| `/api/connections` | GET / POST | List connections / send request |
| `/api/connections/[id]` | PATCH / DELETE | Accept, reject, or remove |
| `/api/connections/pending` | GET | Incoming pending requests |

### Events
| Route | Method | Notes |
|---|---|---|
| `/api/events` | GET / POST | List events / create |
| `/api/events/[id]` | GET / PATCH / DELETE | |
| `/api/events/[id]/memories` | GET / POST | Post-event photos/reviews |

### RSVP
| Route | Method | Notes |
|---|---|---|
| `/api/rsvp` | POST | Submit RSVP request |

### Host (host-only routes)
| Route | Method | Notes |
|---|---|---|
| `/api/host/events` | GET / POST | Host's event list / create |
| `/api/host/events/[id]` | PATCH / DELETE | Edit / delete own event |
| `/api/host/rsvp` | PATCH | Approve or reject an RSVP |

### Feed
| Route | Method | Notes |
|---|---|---|
| `/api/feed/posts` | GET / POST | |
| `/api/feed/posts/[id]` | GET / DELETE | |
| `/api/feed/posts/[id]/comments` | GET / POST | |
| `/api/feed/posts/[id]/like` | POST / DELETE | |
| `/api/feed/comments/[commentId]` | DELETE | |

### Memories
| Route | Method | Notes |
|---|---|---|
| `/api/memories/[id]` | DELETE | |

### Onboarding
| Route | Method | Notes |
|---|---|---|
| `/api/onboarding/complete` | POST | Mark onboarding done, set approvalStatus = pending |

### Admin
| Route | Method | Notes |
|---|---|---|
| `/api/admin/approvals` | GET | List pending approval requests |
| `/api/admin/approvals/[id]` | PATCH | Approve or reject a user |
| `/api/admin/bans` | GET / POST | List banned emails / add ban |
| `/api/admin/bans/[email]` | DELETE | Unban |
| `/api/admin/invites` | GET / POST | List invites / create invite link |
| `/api/admin/invites/[id]` | DELETE | Revoke invite |
| `/api/admin/events/[id]` | DELETE | Remove any event |
| `/api/admin/users/[id]` | DELETE | Delete user account |

---

## FastAPI Routers (`backend/routers/`)

| Router | Responsibility |
|---|---|
| `users.py` | Profile read/update, people list + filters |
| `events.py` | Event CRUD, attendee list |
| `connections.py` | Connection requests, mutual count |
| `rsvp.py` | RSVP submission and status |
| `host.py` | Host-specific event and RSVP management |
| `feed.py` | Posts, comments, likes |
| `memories.py` | Event memories (photos/reviews) |
| `admin.py` | Admin operations proxied from Next.js |

Auth: Next.js passes the session cookie → FastAPI validates via `backend/auth.py`.

---

## Patterns

### Standard proxy route
```typescript
// app/api/connections/route.ts
export async function GET(req: Request) {
  return proxyToBackend(req, '/connections', 'GET');
}
```

### Route with auth guard + payload transform
```typescript
// app/api/users/me/route.ts
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Body;
  const payload: Record<string, unknown> = {};
  if ('stayArrived' in body) payload.stay_arrived = body.stayArrived ?? null;

  return proxyToBackend(req, '/users/me', 'PATCH', payload);
}
```

### Admin route (Drizzle direct)
```typescript
// app/api/admin/approvals/[id]/route.ts
const session = await auth();
if (!isAdminEmail(session?.user?.email)) return Response.json({ error: 'Forbidden' }, { status: 403 });

await db.update(users).set({ approvalStatus: 'approved' }).where(eq(users.id, params.id));
```
