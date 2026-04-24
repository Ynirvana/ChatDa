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
    message: str | None = None


@router.post("")
async def create_rsvp(
    body: RsvpRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Check for existing RSVP
    existing_result = await db.execute(
        select(Rsvp).where(
            and_(Rsvp.event_id == body.event_id, Rsvp.user_id == user_id)
        )
    )
    existing_rsvp = existing_result.scalar_one_or_none()

    # Block re-apply only if pending or approved
    if existing_rsvp and existing_rsvp.status in ("pending", "approved"):
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
    if approved >= event.capacity - 1:
        raise HTTPException(status_code=409, detail="Event is full")

    # Reuse existing cancelled/rejected record instead of creating a new one
    if existing_rsvp:
        existing_rsvp.status = "pending"
        existing_rsvp.message = body.message or None
    else:
        rsvp = Rsvp(id=generate(), event_id=body.event_id, user_id=user_id, status="pending", message=body.message or None)
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
