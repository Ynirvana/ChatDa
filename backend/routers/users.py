from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field, field_validator
from nanoid import generate

from database import get_db, User, SocialLink, Rsvp, Event
from auth import get_current_user_id

router = APIRouter(prefix="/users", tags=["users"])


class SocialLinkIn(BaseModel):
    platform: str = Field(min_length=1, max_length=40)
    url: str = Field(min_length=1, max_length=500)


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
    rsvps: list[dict]
    hosted_events: list[dict]

    class Config:
        from_attributes = True


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

    return ProfileOut(
        id=user.id, name=user.name,
        nationality=user.nationality, status=user.status, bio=user.bio,
        profile_image=user.profile_image,
        onboarding_complete=user.onboarding_complete,
        social_links=[{"platform": l.platform, "url": l.url} for l in links],
        rsvps=my_rsvps,
        hosted_events=hosted_events,
    )
