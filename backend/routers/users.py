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
from settings import settings

router = APIRouter(prefix="/users", tags=["users"])

# v4 값. enum drop 후 application-level로만 관리.
StatusLiteral = Literal['local', 'expat', 'visitor', 'exchange_student', 'worker', 'visiting_soon', 'visited_before']
LanguageLevelLiteral = Literal['native', 'fluent', 'conversational', 'learning']
GenderLiteral = Literal['male', 'female', 'other']


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
    location_district: str | None = Field(default=None, max_length=60)
    status: StatusLiteral | None = None
    school: str | None = Field(default=None, max_length=120)
    gender: GenderLiteral | None = None
    age: int | None = Field(default=None, ge=18, le=99)
    looking_for: list[str] = Field(default_factory=list, max_length=3)
    looking_for_custom: str | None = Field(default=None, max_length=30)
    bio: str | None = Field(default=None, max_length=500)
    profile_image: str | None = None  # Legacy primary — profile_images 있으면 무시됨 (첫 장이 primary)
    profile_images: list[str] | None = Field(default=None, max_length=5)
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

    @field_validator("profile_images")
    @classmethod
    def _check_images(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        cleaned: list[str] = []
        for img in v:
            if not img:
                continue
            if len(img) > 6 * 1024 * 1024:
                raise ValueError("profile_images entry too large (max ~4.5 MiB)")
            if not (img.startswith("data:image/") or img.startswith("http")):
                raise ValueError("invalid profile_images entry")
            cleaned.append(img)
            if len(cleaned) >= 5:
                break
        return cleaned


class ProfileOut(BaseModel):
    id: str
    name: str
    nationality: str | None
    location: str | None
    location_district: str | None
    status: str | None
    school: str | None
    gender: str | None
    age: int | None
    show_personal_info: bool = True
    looking_for: list[str]
    looking_for_custom: str | None
    stay_arrived: date | None
    stay_departed: date | None
    languages: list[dict]
    interests: list[str]
    bio: str | None
    profile_image: str | None  # Primary (backward compat)
    profile_images: list[str] = []
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
    looking_for: list[str] | None = Field(default=None, max_length=3)
    looking_for_custom: str | None = Field(default=None, max_length=30)
    school: str | None = Field(default=None, max_length=120)
    gender: GenderLiteral | None = None
    age: int | None = Field(default=None, ge=18, le=99)
    show_personal_info: bool | None = None
    profile_images: list[str] | None = Field(default=None, max_length=5)

    @field_validator("profile_images")
    @classmethod
    def _check_images(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        cleaned: list[str] = []
        for img in v:
            if not img:
                continue
            if len(img) > 6 * 1024 * 1024:
                raise ValueError("profile_images entry too large (max ~4.5 MiB)")
            if not (img.startswith("data:image/") or img.startswith("http")):
                raise ValueError("invalid profile_images entry")
            cleaned.append(img)
            if len(cleaned) >= 5:
                break
        return cleaned

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
    query = select(User).where(User.onboarding_complete == True)
    users_result = await db.execute(query.order_by(User.created_at.desc()))
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

    # Hosting: users with any upcoming event (date string >= today in YYYY-MM-DD)
    hosting_result = await db.execute(
        select(Event.host_id).where(Event.date >= date.today().isoformat()).distinct()
    )
    hosting_user_ids: set[str] = {row[0] for row in hosting_result.all()}

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
                "location_district": u.location_district,
                "status": u.status,
                "school": u.school,
                "gender": u.gender,
                "age": u.age,
                "looking_for": list(u.looking_for or []),
                "looking_for_custom": u.looking_for_custom,
                "stay_arrived": u.stay_arrived.isoformat() if u.stay_arrived else None,
                "stay_departed": u.stay_departed.isoformat() if u.stay_departed else None,
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
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "is_hosting": u.id in hosting_user_ids,
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
    # age/gender 비공개 토글 — 본인 viewer엔 항상 노출, 그 외엔 show_personal_info=true일 때만
    show_personal_info = (viewer_id == user_id) or user.show_personal_info

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
        "location_district": user.location_district,
        "status": user.status,
        "school": user.school,
        "gender": user.gender if show_personal_info else None,
        "age": user.age if show_personal_info else None,
        "show_personal_info": user.show_personal_info,
        "looking_for": list(user.looking_for or []),
        "looking_for_custom": user.looking_for_custom,
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
    # District는 Seoul일 때만 의미 있음 — 서버에서도 방어
    user.location_district = body.location_district if body.location == 'Seoul' and body.location_district else None
    user.status = body.status or None
    # Gender 필수 — 서버에서도 방어
    if not body.gender:
        raise HTTPException(400, "Gender is required")
    user.gender = body.gender
    user.age = body.age  # optional, Pydantic이 18-99 검증 이미 수행
    # Student일 때 school 필수 — 네트워크 효과. 다른 상태면 null.
    school_clean = (body.school or '').strip()
    if body.status == 'exchange_student':
        if not school_clean:
            raise HTTPException(400, "School is required for students")
        user.school = school_clean
    else:
        user.school = None
    user.looking_for = body.looking_for
    custom = (body.looking_for_custom or '').strip()
    # Hard cap 3: preset + (1 if custom) must not exceed 3
    if len(body.looking_for) + (1 if custom else 0) > 3:
        raise HTTPException(400, "Max 3 motives (preset + custom)")
    user.looking_for_custom = custom or None
    user.bio = body.bio.strip() if body.bio else None
    # 새 방식(multi) — profile_images 배열이 오면 그걸로 대체 + 첫 장을 primary로 동기화
    if body.profile_images is not None:
        user.profile_images = body.profile_images
        user.profile_image = body.profile_images[0] if body.profile_images else None
    elif body.profile_image is not None:
        # 레거시 단일 — 배열도 함께 유지 (primary 한 장짜리)
        user.profile_image = body.profile_image or None
        user.profile_images = [body.profile_image] if body.profile_image else []
    # Photo 필수
    if not user.profile_image:
        raise HTTPException(400, "Profile photo is required")
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
        location_district=user.location_district,
        status=user.status,
        school=user.school,
        gender=user.gender,
        age=user.age,
        show_personal_info=user.show_personal_info,
        looking_for=list(user.looking_for or []),
        looking_for_custom=user.looking_for_custom,
        stay_arrived=user.stay_arrived,
        stay_departed=user.stay_departed,
        languages=list(user.languages or []),
        interests=list(user.interests or []),
        bio=user.bio,
        profile_image=user.profile_image,
        profile_images=list(user.profile_images or []),
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
    if "gender" in data:
        g = data["gender"]
        if not g:
            raise HTTPException(400, "Gender cannot be empty")
        user.gender = g
    if "age" in data:
        user.age = data["age"]  # None 허용 (유저가 비워서 PATCH 가능)
    if "show_personal_info" in data and data["show_personal_info"] is not None:
        user.show_personal_info = bool(data["show_personal_info"])
    if "profile_images" in data:
        imgs = data["profile_images"] or []
        if not imgs:
            raise HTTPException(400, "At least 1 profile photo is required")
        user.profile_images = imgs
        user.profile_image = imgs[0]  # primary 동기화
    if "school" in data:
        s = (data["school"] or "").strip()
        # Student가 아닌 유저가 school 업데이트 시도하면 무시 (상태가 exchange_student여야만 의미)
        if user.status == 'exchange_student':
            if not s:
                raise HTTPException(400, "School is required for students")
            user.school = s
        else:
            user.school = None
    if "looking_for" in data or "looking_for_custom" in data:
        # 두 필드는 합산 상한 3 — 같이 검증
        new_preset = data.get("looking_for") if "looking_for" in data else list(user.looking_for or [])
        new_custom_raw = data.get("looking_for_custom") if "looking_for_custom" in data else user.looking_for_custom
        new_custom = (new_custom_raw or "").strip() if new_custom_raw else ""
        if len(new_preset or []) + (1 if new_custom else 0) > 3:
            raise HTTPException(400, "Max 3 motives (preset + custom)")
        if "looking_for" in data:
            user.looking_for = new_preset or []
        if "looking_for_custom" in data:
            user.looking_for_custom = new_custom or None

    await db.commit()
    return {"ok": True}


class TagsBody(BaseModel):
    tags: list[TagIn] = Field(default_factory=list, max_length=20)


TAG_CAP_PER_CATEGORY = 3


@router.put("/tags")
async def update_tags(
    body: TagsBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Replace all tags for the current user. Hard cap 3 per category."""
    can_do = [t for t in body.tags if t.category == 'can_do']
    looking_for = [t for t in body.tags if t.category == 'looking_for']
    if len(can_do) > TAG_CAP_PER_CATEGORY or len(looking_for) > TAG_CAP_PER_CATEGORY:
        raise HTTPException(
            400,
            f"Max {TAG_CAP_PER_CATEGORY} tags per category (can_do={len(can_do)}, looking_for={len(looking_for)})",
        )
    # Dedupe same tag in same category
    seen: set[tuple[str, str]] = set()
    cleaned: list[TagIn] = []
    for t in body.tags:
        tag_norm = t.tag.strip()
        if not tag_norm:
            continue
        key = (tag_norm, t.category)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(TagIn(tag=tag_norm, category=t.category))

    await db.execute(delete(UserTag).where(UserTag.user_id == user_id))
    for t in cleaned:
        db.add(UserTag(id=generate(), user_id=user_id, tag=t.tag, category=t.category))
    await db.commit()
    return {"ok": True, "count": len(cleaned)}
