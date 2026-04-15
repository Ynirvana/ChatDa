from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel
from nanoid import generate

from database import get_db, Rsvp, Event
from auth import get_current_user_id

router = APIRouter(prefix="/rsvp", tags=["rsvp"])


class RsvpRequest(BaseModel):
    event_id: str


@router.post("")
async def create_rsvp(
    body: RsvpRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # 중복 신청 확인
    existing = await db.execute(
        select(Rsvp).where(
            and_(Rsvp.event_id == body.event_id, Rsvp.user_id == user_id)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already applied")

    # 정원 확인
    event = await db.get(Event, body.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    count_result = await db.execute(
        select(func.count(Rsvp.id)).where(
            and_(Rsvp.event_id == body.event_id, Rsvp.status == "approved")
        )
    )
    approved = count_result.scalar() or 0
    if approved >= event.capacity:
        raise HTTPException(status_code=409, detail="Event is full")

    rsvp = Rsvp(id=generate(), event_id=body.event_id, user_id=user_id, status="pending")
    db.add(rsvp)
    await db.commit()

    return {"ok": True}


@router.get("/status")
async def get_rsvp_status(
    event_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rsvp).where(
            and_(Rsvp.event_id == event_id, Rsvp.user_id == user_id)
        )
    )
    rsvp = result.scalar_one_or_none()
    return {"status": rsvp.status if rsvp else None}
