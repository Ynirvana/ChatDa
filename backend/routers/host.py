from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel, Field, field_validator
from nanoid import generate

from database import get_db, Event, Rsvp, User
from auth import get_current_user_id

router = APIRouter(prefix="/host", tags=["host"])

MAX_IMAGE_B64 = 6 * 1024 * 1024  # ~4.5 MiB raw after base64 decode


def _check_image(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    if len(value) > MAX_IMAGE_B64:
        raise ValueError("image too large (max ~4.5 MiB)")
    if not value.startswith("data:image/") and not value.startswith("http"):
        raise ValueError("invalid image (must be data:image/... or http(s) URL)")
    return value


class CreateEventBody(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    date: str = Field(min_length=10, max_length=10)  # YYYY-MM-DD
    time: str = Field(min_length=1, max_length=16)
    end_time: str | None = Field(default=None, max_length=16)
    location: str = Field(min_length=1, max_length=200)
    area: str | None = Field(default=None, max_length=100)
    capacity: int = Field(ge=1, le=500)
    fee: int = Field(default=0, ge=0, le=10_000_000)
    description: str | None = Field(default=None, max_length=5000)
    cover_image: str | None = None
    google_map_url: str | None = Field(default=None, max_length=2000)
    naver_map_url: str | None = Field(default=None, max_length=2000)
    directions: str | None = Field(default=None, max_length=2000)
    requirements: list[str] = Field(default_factory=list, max_length=20)
    payment_method: str | None = Field(default=None, max_length=40)
    fee_note: str | None = Field(default=None, max_length=500)
    contact_link: str | None = Field(default=None, max_length=2000)

    @field_validator("cover_image")
    @classmethod
    def validate_cover_image(cls, v: str | None) -> str | None:
        return _check_image(v)


class UpdateRsvpBody(BaseModel):
    rsvp_id: str
    status: str  # 'approved' | 'rejected'


@router.post("/events")
async def create_event(
    body: CreateEventBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import json
    event = Event(
        id=generate(),
        title=body.title, date=body.date, time=body.time, end_time=body.end_time or None,
        cover_image=body.cover_image or None,
        location=body.location, area=body.area,
        capacity=body.capacity, fee=body.fee,
        description=body.description, host_id=user_id,
        google_map_url=body.google_map_url or None,
        naver_map_url=body.naver_map_url or None,
        directions=body.directions or None,
        requirements=json.dumps(body.requirements) if body.requirements else None,
        payment_method=body.payment_method or None,
        fee_note=body.fee_note or None,
        contact_link=body.contact_link or None,
    )
    db.add(event)
    await db.commit()
    return {"ok": True, "id": event.id}


@router.patch("/events/{event_id}")
async def update_event(
    event_id: str,
    body: CreateEventBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import json
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.host_id != user_id:
        raise HTTPException(status_code=403, detail="Not your event")

    event.title = body.title
    event.date = body.date
    event.time = body.time
    event.end_time = body.end_time or None
    event.cover_image = body.cover_image or None
    event.location = body.location
    event.area = body.area
    event.capacity = body.capacity
    event.fee = body.fee
    event.description = body.description
    event.google_map_url = body.google_map_url or None
    event.naver_map_url = body.naver_map_url or None
    event.directions = body.directions or None
    event.requirements = json.dumps(body.requirements) if body.requirements else None
    event.payment_method = body.payment_method or None
    event.fee_note = body.fee_note or None
    event.contact_link = body.contact_link or None

    await db.commit()
    return {"ok": True, "id": event.id}


@router.patch("/rsvp")
async def update_rsvp(
    body: UpdateRsvpBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if body.status not in ("approved", "rejected", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")

    rsvp = await db.get(Rsvp, body.rsvp_id)
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")

    event = await db.get(Event, rsvp.event_id)
    if not event or event.host_id != user_id:
        raise HTTPException(status_code=403, detail="Not your event")

    rsvp.status = body.status
    await db.commit()
    return {"ok": True}


@router.get("/events")
async def list_host_events(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date as date_type
    today_str = date_type.today().isoformat()
    result = await db.execute(
        select(Event)
        .where(Event.host_id == user_id, Event.date >= today_str)
        .order_by(Event.date)
    )
    events = result.scalars().all()
    if not events:
        return []

    event_ids = [ev.id for ev in events]

    # All RSVPs (pending + approved) in one query
    rsvp_result = await db.execute(
        select(Rsvp, User)
        .join(User, Rsvp.user_id == User.id)
        .where(Rsvp.event_id.in_(event_ids), Rsvp.status.in_(["pending", "approved"]))
        .order_by(Rsvp.created_at)
    )
    pending_by_event: dict[str, list] = {}
    approved_by_event: dict[str, list] = {}
    approved_counts: dict[str, int] = {}
    for r, u in rsvp_result.all():
        entry = {
            "rsvp_id": r.id,
            "user_id": u.id,
            "user_name": u.name,
            "user_image": u.profile_image,
            "user_nationality": u.nationality,
            "message": r.message,
        }
        if r.status == "pending":
            pending_by_event.setdefault(r.event_id, []).append(entry)
        else:
            approved_by_event.setdefault(r.event_id, []).append(entry)
            approved_counts[r.event_id] = approved_counts.get(r.event_id, 0) + 1

    return [
        {
            "id": ev.id, "title": ev.title, "date": ev.date, "time": ev.time,
            "location": ev.location, "area": ev.area,
            "capacity": ev.capacity, "fee": ev.fee,
            "description": ev.description,
            "google_map_url": ev.google_map_url,
            "naver_map_url": ev.naver_map_url,
            "meeting_details": ev.directions,
            "approved_count": approved_counts.get(ev.id, 0),
            "pending_rsvps": pending_by_event.get(ev.id, []),
            "approved_rsvps": approved_by_event.get(ev.id, []),
        }
        for ev in events
    ]


@router.get("/pending")
async def get_pending_rsvps(
    event_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Rsvp.status == "pending", Event.host_id == user_id]
    if event_id:
        conditions.append(Event.id == event_id)

    result = await db.execute(
        select(Rsvp, Event, User)
        .join(Event, Rsvp.event_id == Event.id)
        .join(User, Rsvp.user_id == User.id)
        .where(and_(*conditions))
        .order_by(Rsvp.created_at)
    )
    rows = result.all()
    return [
        {
            "rsvp_id": r.id, "status": r.status,
            "event_id": ev.id, "event_title": ev.title,
            "user_id": u.id, "user_name": u.name,
            "user_nationality": u.nationality, "user_bio": u.bio,
            "user_image": u.profile_image,
            "message": r.message,
        }
        for r, ev, u in rows
    ]
