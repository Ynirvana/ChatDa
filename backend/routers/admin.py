from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from nanoid import generate

from database import (
    get_db,
    User,
    Event,
    Rsvp,
    SocialLink,
    Post,
    PostLike,
    PostComment,
    EventMemory,
    BannedEmail,
    InviteToken,
)
from auth import require_admin, is_admin_email

router = APIRouter(prefix="/admin", tags=["admin"])

INVITE_TTL_HOURS = 48


@router.get("/overview")
async def overview(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Recent content + all users/events for moderation."""

    posts_rows = (
        await db.execute(
            select(Post, User.name, User.email)
            .join(User, Post.user_id == User.id)
            .order_by(desc(Post.created_at))
            .limit(50)
        )
    ).all()

    comments_rows = (
        await db.execute(
            select(PostComment, User.name, User.email)
            .join(User, PostComment.user_id == User.id)
            .order_by(desc(PostComment.created_at))
            .limit(50)
        )
    ).all()

    memories_rows = (
        await db.execute(
            select(EventMemory, User.name, User.email, Event.title)
            .join(User, EventMemory.user_id == User.id)
            .join(Event, EventMemory.event_id == Event.id)
            .order_by(desc(EventMemory.created_at))
            .limit(50)
        )
    ).all()

    users_rows = (
        await db.execute(select(User).order_by(desc(User.created_at)))
    ).scalars().all()

    events_rows = (
        await db.execute(select(Event).order_by(desc(Event.created_at)))
    ).scalars().all()

    return {
        "posts": [
            {
                "id": p.id,
                "content": p.content,
                "user_id": p.user_id,
                "user_name": name,
                "user_email": email,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p, name, email in posts_rows
        ],
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "post_id": c.post_id,
                "user_id": c.user_id,
                "user_name": name,
                "user_email": email,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c, name, email in comments_rows
        ],
        "memories": [
            {
                "id": m.id,
                "content": m.content,
                "event_id": m.event_id,
                "event_title": title,
                "user_id": m.user_id,
                "user_name": name,
                "user_email": email,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m, name, email, title in memories_rows
        ],
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "nationality": u.nationality,
                "onboarding_complete": u.onboarding_complete,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users_rows
        ],
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "date": e.date,
                "area": e.area,
                "host_id": e.host_id,
                "capacity": e.capacity,
            }
            for e in events_rows
        ],
    }


@router.delete("/users/{user_id}")
async def delete_user_cascade(
    user_id: str,
    also_ban: bool = True,
    admin_email: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user and cascade all their content + hosted events.
    If also_ban=true (default), the user's email is added to banned_emails
    so they cannot re-register. Admin emails are never banned.

    Self-protection: an admin cannot delete their own account or any other
    admin account — this would lock the service out of moderation.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_email = user.email

    # 자기 자신 삭제 금지 — 실수로 본인 락아웃 방지
    if user_email and user_email.lower() == admin_email.lower():
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    # 다른 admin 삭제도 금지 — ban 엔드포인트와 일관성. 관리자 권한 회수는
    # ADMIN_EMAILS env에서 이메일을 빼는 방식으로만 가능.
    if user_email and is_admin_email(user_email):
        raise HTTPException(status_code=400, detail="Cannot delete an admin account (remove from ADMIN_EMAILS first)")

    # Hosted event IDs (their rsvps/memories also need cleanup)
    hosted_ids = (
        await db.execute(select(Event.id).where(Event.host_id == user_id))
    ).scalars().all()

    # User's own post IDs (their comments/likes also need cleanup)
    own_post_ids = (
        await db.execute(select(Post.id).where(Post.user_id == user_id))
    ).scalars().all()

    # Delete dependents before parents (no FK cascade defined in schema)
    await db.execute(
        delete(EventMemory).where(
            (EventMemory.user_id == user_id)
            | (EventMemory.event_id.in_(hosted_ids) if hosted_ids else False)
        )
    )
    await db.execute(delete(PostLike).where(PostLike.user_id == user_id))
    if own_post_ids:
        await db.execute(delete(PostLike).where(PostLike.post_id.in_(own_post_ids)))
    await db.execute(delete(PostComment).where(PostComment.user_id == user_id))
    if own_post_ids:
        await db.execute(delete(PostComment).where(PostComment.post_id.in_(own_post_ids)))
    await db.execute(delete(Post).where(Post.user_id == user_id))
    await db.execute(delete(Rsvp).where(Rsvp.user_id == user_id))
    if hosted_ids:
        await db.execute(delete(Rsvp).where(Rsvp.event_id.in_(hosted_ids)))
        await db.execute(delete(Event).where(Event.host_id == user_id))
    await db.execute(delete(SocialLink).where(SocialLink.user_id == user_id))
    await db.delete(user)

    banned = False
    if also_ban and user_email and not is_admin_email(user_email):
        existing = await db.get(BannedEmail, user_email)
        if not existing:
            db.add(BannedEmail(email=user_email, banned_by=admin_email, reason="account deleted"))
            banned = True

    await db.commit()

    return {
        "ok": True,
        "deleted_user": user_id,
        "hosted_events_removed": len(hosted_ids),
        "banned": banned,
    }


# ── Ban management ─────────────────────────────────────────────────────────


class BanRequest(BaseModel):
    email: str
    reason: str | None = None


@router.post("/bans", status_code=201)
async def create_ban(
    payload: BanRequest,
    admin_email: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Block this email from signing in. Existing sessions get 403 on next API call."""
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    if is_admin_email(email):
        raise HTTPException(status_code=400, detail="Cannot ban an admin email")

    existing = await db.get(BannedEmail, email)
    if existing:
        return {"ok": True, "email": email, "already_banned": True}

    db.add(BannedEmail(email=email, banned_by=admin_email, reason=payload.reason))
    await db.commit()
    return {"ok": True, "email": email, "banned_by": admin_email}


@router.get("/bans")
async def list_bans(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(BannedEmail).order_by(desc(BannedEmail.banned_at)))).scalars().all()
    return {
        "bans": [
            {
                "email": b.email,
                "banned_at": b.banned_at.isoformat() if b.banned_at else None,
                "banned_by": b.banned_by,
                "reason": b.reason,
            }
            for b in rows
        ]
    }


@router.delete("/bans/{email}")
async def delete_ban(
    email: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(BannedEmail, email.strip().lower())
    if not row:
        raise HTTPException(status_code=404, detail="Not banned")
    await db.delete(row)
    await db.commit()
    return {"ok": True, "unbanned": email}


@router.delete("/events/{event_id}")
async def delete_event_cascade(
    event_id: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete an event and cascade its rsvps + memories."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.execute(delete(Rsvp).where(Rsvp.event_id == event_id))
    await db.execute(delete(EventMemory).where(EventMemory.event_id == event_id))
    await db.delete(event)
    await db.commit()
    return {"ok": True, "deleted_event": event_id}


# ── Invite tokens ──────────────────────────────────────────────────────────


class InviteCreateRequest(BaseModel):
    note: str | None = Field(default=None, max_length=120)


@router.post("/invites", status_code=201)
async def create_invite(
    payload: InviteCreateRequest,
    admin_email: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin이 새 invite 토큰 발급. 7일 expiry, single-use.
    Returns token (URL-safe string) — admin이 Threads DM으로 공유할 URL 구성용."""
    admin = (await db.execute(select(User).where(User.email == admin_email))).scalars().first()
    token_value = generate(
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 24
    )
    expires_at = datetime.now(timezone.utc) + timedelta(hours=INVITE_TTL_HOURS)
    row = InviteToken(
        id=generate(size=21),
        token=token_value,
        created_by_user_id=admin.id if admin else None,
        expires_at=expires_at.replace(tzinfo=None),
        note=(payload.note or "").strip() or None,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {
        "id": row.id,
        "token": row.token,
        "expires_at": row.expires_at.isoformat() if row.expires_at else None,
        "note": row.note,
    }


@router.get("/invites")
async def list_invites(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(select(InviteToken).order_by(desc(InviteToken.created_at)).limit(50))
    ).scalars().all()
    claimed_user_ids = [r.claimed_by_user_id for r in rows if r.claimed_by_user_id]
    claimed_users: dict[str, dict] = {}
    if claimed_user_ids:
        result = await db.execute(select(User).where(User.id.in_(claimed_user_ids)))
        for u in result.scalars().all():
            claimed_users[u.id] = {"id": u.id, "name": u.name, "email": u.email}
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return {
        "invites": [
            {
                "id": r.id,
                "token": r.token,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "claimed_at": r.claimed_at.isoformat() if r.claimed_at else None,
                "claimed_by": claimed_users.get(r.claimed_by_user_id) if r.claimed_by_user_id else None,
                "note": r.note,
                "state": (
                    "claimed" if r.claimed_at
                    else "expired" if (r.expires_at and r.expires_at < now)
                    else "unused"
                ),
            }
            for r in rows
        ]
    }


@router.delete("/invites/{invite_id}")
async def revoke_invite(
    invite_id: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(InviteToken, invite_id)
    if not row:
        raise HTTPException(status_code=404, detail="Invite not found")
    if row.claimed_at:
        raise HTTPException(status_code=400, detail="Already claimed — cannot revoke")
    await db.delete(row)
    await db.commit()
    return {"ok": True, "revoked": invite_id}
