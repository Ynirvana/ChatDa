from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from nanoid import generate

from database import get_db, Event, Rsvp, User
from auth import get_current_user_id

router = APIRouter(prefix="/host", tags=["host"])


class CreateEventBody(BaseModel):
    title: str
    date: str
    time: str
    end_time: str | None = None
    location: str
    area: str | None = None
    capacity: int
    fee: int = 0
    description: str | None = None
    cover_image: str | None = None
    google_map_url: str | None = None
    naver_map_url: str | None = None
    directions: str | None = None
    requirements: list[str] = []
    payment_method: str | None = None
    fee_note: str | None = None


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

    await db.commit()
    return {"ok": True, "id": event.id}


@router.patch("/rsvp")
async def update_rsvp(
    body: UpdateRsvpBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if body.status not in ("approved", "rejected"):
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
    result = await db.execute(
        select(Event).where(Event.host_id == user_id).order_by(Event.date.desc())
    )
    events = result.scalars().all()
    return [
        {
            "id": ev.id, "title": ev.title, "date": ev.date, "time": ev.time,
            "location": ev.location, "area": ev.area,
            "capacity": ev.capacity, "fee": ev.fee,
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
