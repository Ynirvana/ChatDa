from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel
from datetime import date as DateType
import json

from database import get_db, Event, Rsvp, User, SocialLink

router = APIRouter(prefix="/events", tags=["events"])


class AttendeePreview(BaseModel):
    id: str
    name: str
    profile_image: str | None


class EventOut(BaseModel):
    id: str
    title: str
    date: str
    time: str
    end_time: str | None
    cover_image: str | None
    location: str
    area: str | None
    capacity: int
    fee: int
    approved_count: int
    attendee_previews: list[AttendeePreview]

    class Config:
        from_attributes = True


class AttendeeOut(BaseModel):
    id: str
    name: str
    nationality: str | None
    bio: str | None
    profile_image: str | None
    social_links: list[dict]


class HostOut(BaseModel):
    id: str
    name: str
    bio: str | None
    profile_image: str | None
    nationality: str | None
    social_links: list[dict]


class EventDetailOut(BaseModel):
    id: str
    title: str
    date: str
    time: str
    end_time: str | None
    cover_image: str | None
    location: str
    area: str | None
    capacity: int
    fee: int
    description: str | None
    google_map_url: str | None
    naver_map_url: str | None
    directions: str | None
    requirements: list[str]
    payment_method: str | None
    fee_note: str | None
    approved_count: int
    host: HostOut | None
    attendees: list[AttendeeOut]


@router.get("", response_model=list[EventOut])
async def list_events(past: bool = False, db: AsyncSession = Depends(get_db)):
    today = DateType.today().isoformat()

    approved_count_sq = (
        select(Rsvp.event_id, func.count(Rsvp.id).label("cnt"))
        .where(Rsvp.status == "approved")
        .group_by(Rsvp.event_id)
        .subquery()
    )

    base_query = (
        select(Event, func.coalesce(approved_count_sq.c.cnt, 0).label("approved_count"))
        .outerjoin(approved_count_sq, Event.id == approved_count_sq.c.event_id)
    )
    if past:
        query = base_query.where(Event.date < today).order_by(Event.date.desc(), Event.time.desc())
    else:
        query = base_query.where(Event.date >= today).order_by(Event.date, Event.time)

    rows = (await db.execute(query)).all()
    event_ids = [ev.id for ev, _ in rows]

    # Preload hosts — they count as attendee #1 and lead the preview stack
    host_ids = [ev.host_id for ev, _ in rows if ev.host_id]
    hosts_by_id: dict[str, User] = {}
    if host_ids:
        host_rows = (
            await db.execute(select(User).where(User.id.in_(host_ids)))
        ).scalars().all()
        hosts_by_id = {u.id: u for u in host_rows}

    # Preview: host first, then up to 4 most recent approved attendees
    previews_by_event: dict[str, list[AttendeePreview]] = {}
    for ev, _ in rows:
        seeded: list[AttendeePreview] = []
        if ev.host_id and ev.host_id in hosts_by_id:
            h = hosts_by_id[ev.host_id]
            seeded.append(AttendeePreview(id=h.id, name=h.name, profile_image=h.profile_image))
        previews_by_event[ev.id] = seeded

    if event_ids:
        preview_query = (
            select(Rsvp.event_id, User.id, User.name, User.profile_image, Rsvp.created_at)
            .join(User, User.id == Rsvp.user_id)
            .where(Rsvp.event_id.in_(event_ids), Rsvp.status == "approved")
            .order_by(Rsvp.event_id, Rsvp.created_at)
        )
        for r in (await db.execute(preview_query)).all():
            lst = previews_by_event.setdefault(r.event_id, [])
            # Skip if host is also somehow RSVP'd (dedupe by user id)
            if any(p.id == r.id for p in lst):
                continue
            if len(lst) < 5:
                lst.append(AttendeePreview(id=r.id, name=r.name, profile_image=r.profile_image))

    return [
        EventOut(
            id=ev.id, title=ev.title, date=ev.date, time=ev.time, end_time=ev.end_time,
            cover_image=ev.cover_image,
            location=ev.location, area=ev.area,
            capacity=ev.capacity, fee=ev.fee,
            # Host counts as attendee #1
            approved_count=int(cnt) + (1 if ev.host_id else 0),
            attendee_previews=previews_by_event.get(ev.id, []),
        )
        for ev, cnt in rows
    ]


@router.get("/{event_id}", response_model=EventDetailOut)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Host info
    host_out: HostOut | None = None
    if event.host_id:
        host_user = await db.get(User, event.host_id)
        if host_user:
            host_links_result = await db.execute(
                select(SocialLink).where(SocialLink.user_id == event.host_id)
            )
            host_links = host_links_result.scalars().all()
            host_out = HostOut(
                id=host_user.id,
                name=host_user.name,
                bio=host_user.bio,
                profile_image=host_user.profile_image,
                nationality=host_user.nationality,
                social_links=[{"platform": l.platform, "url": l.url} for l in host_links],
            )

    # Approved attendees
    result = await db.execute(
        select(User)
        .join(Rsvp, and_(Rsvp.user_id == User.id, Rsvp.event_id == event_id, Rsvp.status == "approved"))
    )
    attendee_users = result.scalars().all()

    # Social links for attendees
    if attendee_users:
        ids = [u.id for u in attendee_users]
        links_result = await db.execute(
            select(SocialLink).where(SocialLink.user_id.in_(ids))
        )
        all_links = links_result.scalars().all()
    else:
        all_links = []

    attendees = [
        AttendeeOut(
            id=u.id, name=u.name, nationality=u.nationality,
            bio=u.bio, profile_image=u.profile_image,
            social_links=[
                {"platform": l.platform, "url": l.url}
                for l in all_links if l.user_id == u.id
            ],
        )
        for u in attendee_users
    ]

    approved_count_result = await db.execute(
        select(func.count(Rsvp.id))
        .where(and_(Rsvp.event_id == event_id, Rsvp.status == "approved"))
    )
    approved_count = (approved_count_result.scalar() or 0) + (1 if event.host_id else 0)

    return EventDetailOut(
        id=event.id, title=event.title, date=event.date, time=event.time, end_time=event.end_time,
        cover_image=event.cover_image,
        location=event.location, area=event.area,
        capacity=event.capacity, fee=event.fee,
        description=event.description,
        google_map_url=event.google_map_url,
        naver_map_url=event.naver_map_url,
        directions=event.directions,
        requirements=json.loads(event.requirements) if event.requirements else [],
        payment_method=event.payment_method,
        fee_note=event.fee_note,
        approved_count=int(approved_count),
        host=host_out,
        attendees=attendees,
    )
