from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy
from sqlalchemy import select, delete
from pydantic import BaseModel, Field, field_validator
from nanoid import generate

from database import get_db, User, SocialLink, UserTag, Rsvp, Event, Connection
from auth import get_current_user_id, optional_user_id

router = APIRouter(prefix="/users", tags=["users"])


class SocialLinkIn(BaseModel):
    platform: str = Field(min_length=1, max_length=40)
    url: str = Field(min_length=1, max_length=500)


class TagIn(BaseModel):
    tag: str = Field(min_length=1, max_length=60)
    category: str = Field(pattern=r'^(can_do|looking_for)$')


class OnboardingBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    nationality: str = Field(min_length=1, max_length=60)
    status: str | None = Field(default=None, max_length=40)
    bio: str | None = Field(default=None, max_length=500)
    profile_image: str | None = None
    social_links: list[SocialLinkIn] = Field(default_factory=list, max_length=10)

    @field_validator("profile_image")
    @classmethod
    def _check_image(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if len(v) > 6 * 1024 * 1024:  # ~4.5 MiB raw
            raise ValueError("profile_image too large (max ~4.5 MiB)")
        if not (v.startswith("data:image/") or v.startswith("http")):
            raise ValueError("invalid profile_image")
        return v


class ProfileOut(BaseModel):
    id: str
    name: str
    nationality: str | None
    status: str | None
    bio: str | None
    profile_image: str | None
    onboarding_complete: bool
    social_links: list[dict]
    tags: list[dict]
    rsvps: list[dict]
    hosted_events: list[dict]

    class Config:
        from_attributes = True


@router.get("/directory")
async def directory(
    viewer_id: str | None = Depends(optional_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Public directory of onboarded users. Social links only shown to connected users."""
    users_result = await db.execute(
        select(User)
        .where(User.onboarding_complete == True)
        .order_by(User.created_at.desc())
    )
    all_users = users_result.scalars().all()
    if not all_users:
        return {"users": []}

    user_ids = [u.id for u in all_users]

    # Social links
    links_result = await db.execute(
        select(SocialLink).where(SocialLink.user_id.in_(user_ids))
    )
    links_by_user: dict[str, list[dict]] = {}
    for link in links_result.scalars().all():
        links_by_user.setdefault(link.user_id, []).append(
            {"platform": link.platform, "url": link.url}
        )

    # Tags
    tags_result = await db.execute(
        select(UserTag).where(UserTag.user_id.in_(user_ids))
    )
    tags_by_user: dict[str, list[dict]] = {}
    for tag in tags_result.scalars().all():
        tags_by_user.setdefault(tag.user_id, []).append(
            {"tag": tag.tag, "category": tag.category}
        )

    # Connections for viewer (to gate social links)
    connected_ids: set[str] = set()
    connection_map: dict[str, dict] = {}  # user_id → {id, status}
    if viewer_id:
        conns_result = await db.execute(
            select(Connection).where(
                sqlalchemy.or_(
                    Connection.requester_id == viewer_id,
                    Connection.recipient_id == viewer_id,
                )
            )
        )
        for c in conns_result.scalars().all():
            other = c.recipient_id if c.requester_id == viewer_id else c.requester_id
            connection_map[other] = {"id": c.id, "status": c.status}
            if c.status == "accepted":
                connected_ids.add(other)

    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "nationality": u.nationality,
                "status": u.status,
                "bio": u.bio,
                "profile_image": u.profile_image,
                "social_links": links_by_user.get(u.id, [])
                    if (viewer_id == u.id or u.id in connected_ids)
                    else [],
                "tags": tags_by_user.get(u.id, []),
                "connection": connection_map.get(u.id),
            }
            for u in all_users
            if u.id != viewer_id  # don't show self
        ]
    }


@router.post("/onboarding")
async def complete_onboarding(
    body: OnboardingBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = body.name.strip()
    user.nationality = body.nationality
    user.status = body.status or None
    user.bio = body.bio.strip() if body.bio else None
    if body.profile_image is not None:
        user.profile_image = body.profile_image or None
    user.onboarding_complete = True

    # 소셜링크 교체
    await db.execute(delete(SocialLink).where(SocialLink.user_id == user_id))
    for link in body.social_links:
        db.add(SocialLink(id=generate(), user_id=user_id, platform=link.platform, url=link.url))

    await db.commit()
    return {"ok": True}


@router.get("/me", response_model=ProfileOut)
async def get_my_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    links_result = await db.execute(
        select(SocialLink).where(SocialLink.user_id == user_id)
    )
    links = links_result.scalars().all()

    rsvps_result = await db.execute(
        select(Rsvp, Event)
        .join(Event, Rsvp.event_id == Event.id)
        .where(Rsvp.user_id == user_id)
        .order_by(Event.date)
    )
    my_rsvps = [
        {
            "rsvp_id": r.id, "status": r.status,
            "event_id": ev.id, "title": ev.title,
            "date": ev.date, "time": ev.time, "area": ev.area,
        }
        for r, ev in rsvps_result.all()
    ]

    hosted_result = await db.execute(
        select(Event).where(Event.host_id == user_id).order_by(Event.date)
    )
    hosted_events = [
        {
            "event_id": ev.id, "title": ev.title,
            "date": ev.date, "time": ev.time, "area": ev.area,
        }
        for ev in hosted_result.scalars().all()
    ]

    tags_result = await db.execute(
        select(UserTag).where(UserTag.user_id == user_id)
    )
    my_tags = [{"tag": t.tag, "category": t.category} for t in tags_result.scalars().all()]

    return ProfileOut(
        id=user.id, name=user.name,
        nationality=user.nationality, status=user.status, bio=user.bio,
        profile_image=user.profile_image,
        onboarding_complete=user.onboarding_complete,
        social_links=[{"platform": l.platform, "url": l.url} for l in links],
        tags=my_tags,
        rsvps=my_rsvps,
        hosted_events=hosted_events,
    )


class TagsBody(BaseModel):
    tags: list[TagIn] = Field(default_factory=list, max_length=20)


@router.put("/tags")
async def update_tags(
    body: TagsBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Replace all tags for the current user."""
    await db.execute(delete(UserTag).where(UserTag.user_id == user_id))
    for t in body.tags:
        db.add(UserTag(id=generate(), user_id=user_id, tag=t.tag, category=t.category))
    await db.commit()
    return {"ok": True, "count": len(body.tags)}
