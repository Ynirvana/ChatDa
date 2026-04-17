from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy
from sqlalchemy import select, delete
from pydantic import BaseModel, Field, field_validator
from typing import Literal
from datetime import date
from nanoid import generate

from database import get_db, User, SocialLink, UserTag, Rsvp, Event, Connection
from auth import get_current_user_id, optional_user_id

router = APIRouter(prefix="/users", tags=["users"])

# v4 값. enum drop 후 application-level로만 관리.
StatusLiteral = Literal['local', 'expat', 'visitor', 'visiting_soon', 'visited_before']
LanguageLevelLiteral = Literal['native', 'fluent', 'conversational', 'learning']


class LanguageEntry(BaseModel):
    language: str = Field(min_length=1, max_length=40)
    level: LanguageLevelLiteral


class SocialLinkIn(BaseModel):
    platform: str = Field(min_length=1, max_length=40)
    url: str = Field(min_length=1, max_length=500)


class TagIn(BaseModel):
    tag: str = Field(min_length=1, max_length=60)
    category: str = Field(pattern=r'^(can_do|looking_for)$')


class OnboardingBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    nationality: str = Field(min_length=1, max_length=60)
    location: str | None = Field(default=None, max_length=60)
    status: StatusLiteral | None = None
    looking_for: list[str] = Field(default_factory=list, max_length=3)
    bio: str | None = Field(default=None, max_length=500)
    profile_image: str | None = None
    social_links: list[SocialLinkIn] = Field(default_factory=list, max_length=10)

    @field_validator("looking_for")
    @classmethod
    def _validate_looking_for(cls, v: list[str]) -> list[str]:
        # 중복 제거 + 개별 길이 제한. 실제 id 검증은 프론트 constants와 일치시키되 백엔드도 최소한의 sanity.
        cleaned = []
        seen: set[str] = set()
        for item in v:
            s = item.strip()
            if not s or s in seen:
                continue
            if len(s) > 40:
                raise ValueError("looking_for item too long")
            seen.add(s)
            cleaned.append(s)
        return cleaned

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
    location: str | None
    status: str | None
    looking_for: list[str]
    stay_arrived: date | None
    stay_departed: date | None
    languages: list[dict]
    interests: list[str]
    bio: str | None
    profile_image: str | None
    onboarding_complete: bool
    social_links: list[dict]
    tags: list[dict]
    rsvps: list[dict]
    hosted_events: list[dict]

    class Config:
        from_attributes = True


class ProfilePatchBody(BaseModel):
    """Step 2 필드만 업데이트. 전부 optional — partial update."""
    bio: str | None = Field(default=None, max_length=500)
    stay_arrived: date | None = None
    stay_departed: date | None = None
    languages: list[LanguageEntry] | None = Field(default=None, max_length=20)
    interests: list[str] | None = Field(default=None, max_length=10)

    @field_validator("interests")
    @classmethod
    def _clean_interests(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        out: list[str] = []
        seen: set[str] = set()
        for item in v:
            s = item.strip()
            if not s or s in seen:
                continue
            if len(s) > 40:
                raise ValueError("interest too long")
            seen.add(s)
            out.append(s)
        return out

    @field_validator("languages")
    @classmethod
    def _dedupe_langs(cls, v: list[LanguageEntry] | None) -> list[LanguageEntry] | None:
        if v is None:
            return None
        seen: set[str] = set()
        out: list[LanguageEntry] = []
        for e in v:
            key = e.language.strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(e)
        return out


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
    platforms_by_user: dict[str, list[str]] = {}
    for link in links_result.scalars().all():
        links_by_user.setdefault(link.user_id, []).append(
            {"platform": link.platform, "url": link.url}
        )
        platforms_by_user.setdefault(link.user_id, []).append(link.platform)

    # Tags
    tags_result = await db.execute(
        select(UserTag).where(UserTag.user_id.in_(user_ids))
    )
    tags_by_user: dict[str, list[dict]] = {}
    for tag in tags_result.scalars().all():
        tags_by_user.setdefault(tag.user_id, []).append(
            {"tag": tag.tag, "category": tag.category}
        )

    # Connections for viewer (to gate social links + mutual count)
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

    # Mutual connections: 각 target이 accepted인 사람들의 집합 만든 뒤 viewer connected_ids와 교집합 크기
    mutual_by_user: dict[str, int] = {}
    if viewer_id and connected_ids:
        all_accepted = await db.execute(
            select(Connection).where(Connection.status == "accepted")
        )
        peers_by_user: dict[str, set[str]] = {}
        for c in all_accepted.scalars().all():
            peers_by_user.setdefault(c.requester_id, set()).add(c.recipient_id)
            peers_by_user.setdefault(c.recipient_id, set()).add(c.requester_id)
        for u in all_users:
            if u.id == viewer_id:
                continue
            peers = peers_by_user.get(u.id, set())
            count = len(peers & connected_ids)
            if count > 0:
                mutual_by_user[u.id] = count

    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "nationality": u.nationality,
                "location": u.location,
                "status": u.status,
                "looking_for": list(u.looking_for or []),
                "languages": list(u.languages or []),
                "interests": list(u.interests or []),
                "bio": u.bio,
                "profile_image": u.profile_image,
                "social_links": links_by_user.get(u.id, [])
                    if (viewer_id == u.id or u.id in connected_ids)
                    else [],
                # URL은 connect 전엔 숨기되 플랫폼 이름만 노출 — 필터/아이콘 프리뷰용
                "social_platforms": platforms_by_user.get(u.id, []),
                "tags": tags_by_user.get(u.id, []),
                "connection": connection_map.get(u.id),
                "mutual_count": mutual_by_user.get(u.id, 0),
            }
            for u in all_users
            if u.id != viewer_id  # don't show self
        ]
    }


@router.get("/{user_id}/profile")
async def get_public_profile(
    user_id: str,
    viewer_id: str | None = Depends(optional_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Public profile of a specific user. Social links gated behind connection."""
    user = await db.get(User, user_id)
    if not user or not user.onboarding_complete:
        raise HTTPException(404, "User not found")

    links = (await db.execute(
        select(SocialLink).where(SocialLink.user_id == user_id)
    )).scalars().all()

    tags = (await db.execute(
        select(UserTag).where(UserTag.user_id == user_id)
    )).scalars().all()

    connection_info = None
    is_connected = False
    if viewer_id and viewer_id != user_id:
        conn = (await db.execute(
            select(Connection).where(
                sqlalchemy.or_(
                    sqlalchemy.and_(Connection.requester_id == viewer_id, Connection.recipient_id == user_id),
                    sqlalchemy.and_(Connection.requester_id == user_id, Connection.recipient_id == viewer_id),
                )
            )
        )).scalars().first()
        if conn:
            connection_info = {"id": conn.id, "status": conn.status}
            is_connected = conn.status == "accepted"

    show_social = (viewer_id == user_id) or is_connected

    # Events hosted
    hosted_result = await db.execute(
        select(Event).where(Event.host_id == user_id).order_by(Event.date.desc())
    )
    hosted = [
        {"id": e.id, "title": e.title, "date": e.date, "area": e.area}
        for e in hosted_result.scalars().all()
    ]

    # Events attended (approved RSVPs)
    attended_result = await db.execute(
        select(Rsvp, Event)
        .join(Event, Rsvp.event_id == Event.id)
        .where(Rsvp.user_id == user_id, Rsvp.status == "approved")
    )
    attended_count = len(attended_result.all())

    # Mutual connections (if viewer is logged in)
    mutual_count = 0
    if viewer_id and viewer_id != user_id:
        viewer_conns = (await db.execute(
            select(Connection).where(
                sqlalchemy.or_(Connection.requester_id == viewer_id, Connection.recipient_id == viewer_id),
                Connection.status == "accepted",
            )
        )).scalars().all()
        viewer_connected_ids = set()
        for c in viewer_conns:
            viewer_connected_ids.add(c.recipient_id if c.requester_id == viewer_id else c.requester_id)

        target_conns = (await db.execute(
            select(Connection).where(
                sqlalchemy.or_(Connection.requester_id == user_id, Connection.recipient_id == user_id),
                Connection.status == "accepted",
            )
        )).scalars().all()
        target_connected_ids = set()
        for c in target_conns:
            target_connected_ids.add(c.recipient_id if c.requester_id == user_id else c.requester_id)

        mutual_count = len(viewer_connected_ids & target_connected_ids)

    return {
        "id": user.id,
        "name": user.name,
        "nationality": user.nationality,
        "location": user.location,
        "status": user.status,
        "looking_for": list(user.looking_for or []),
        "stay_arrived": user.stay_arrived.isoformat() if user.stay_arrived else None,
        "stay_departed": user.stay_departed.isoformat() if user.stay_departed else None,
        "languages": list(user.languages or []),
        "interests": list(user.interests or []),
        "bio": user.bio,
        "profile_image": user.profile_image,
        "social_links": [{"platform": l.platform, "url": l.url} for l in links] if show_social else [],
        "social_platforms": [l.platform for l in links],
        "tags": [{"tag": t.tag, "category": t.category} for t in tags],
        "connection": connection_info,
        "hosted_events": hosted,
        "attended_count": attended_count,
        "mutual_count": mutual_count,
        "created_at": user.created_at.isoformat() if user.created_at else None,
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
    user.location = body.location or None
    user.status = body.status or None
    user.looking_for = body.looking_for
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
        nationality=user.nationality, location=user.location,
        status=user.status,
        looking_for=list(user.looking_for or []),
        stay_arrived=user.stay_arrived,
        stay_departed=user.stay_departed,
        languages=list(user.languages or []),
        interests=list(user.interests or []),
        bio=user.bio,
        profile_image=user.profile_image,
        onboarding_complete=user.onboarding_complete,
        social_links=[{"platform": l.platform, "url": l.url} for l in links],
        tags=my_tags,
        rsvps=my_rsvps,
        hosted_events=hosted_events,
    )


@router.patch("/me")
async def patch_my_profile(
    body: ProfilePatchBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Step 2 필드 업데이트 — 온보딩 끝난 뒤 프로필 페이지에서 호출. Partial update."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Pydantic exclude_unset으로 실제 들어온 필드만 업데이트
    data = body.model_dump(exclude_unset=True)
    if "bio" in data:
        v = data["bio"]
        user.bio = v.strip() if v else None
    if "stay_arrived" in data:
        user.stay_arrived = data["stay_arrived"]
    if "stay_departed" in data:
        user.stay_departed = data["stay_departed"]
    if "languages" in data:
        # LanguageEntry → dict 직렬화. 전부 교체.
        user.languages = [
            {"language": e["language"].strip(), "level": e["level"]}
            for e in data["languages"] or []
        ]
    if "interests" in data:
        user.interests = data["interests"] or []

    await db.commit()
    return {"ok": True}


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
