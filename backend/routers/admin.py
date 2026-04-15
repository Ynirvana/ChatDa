from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete

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
)
from auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


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
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user and cascade all their content + hosted events."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    await db.commit()

    return {"ok": True, "deleted_user": user_id, "hosted_events_removed": len(hosted_ids)}


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
