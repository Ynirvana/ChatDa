import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from nanoid import generate

from database import get_db, Event, EventMemory, Rsvp, User
from auth import get_current_user_id

router = APIRouter(tags=["memories"])


class MemoryOut(BaseModel):
    id: str
    event_id: str
    content: str
    photos: list[str]
    created_at: str
    author_id: str
    author_name: str
    author_image: str | None


class CreateMemoryBody(BaseModel):
    content: str
    photos: list[str] = []


@router.get("/events/{event_id}/memories", response_model=list[MemoryOut])
async def list_memories(event_id: str, db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(EventMemory, User)
        .join(User, EventMemory.user_id == User.id)
        .where(EventMemory.event_id == event_id)
        .order_by(EventMemory.created_at.desc())
    )
    result = []
    for mem, user in rows.all():
        photos = json.loads(mem.photos) if mem.photos else []
        result.append(MemoryOut(
            id=mem.id,
            event_id=mem.event_id,
            content=mem.content,
            photos=photos,
            created_at=mem.created_at.isoformat(),
            author_id=user.id,
            author_name=user.name,
            author_image=user.profile_image,
        ))
    return result


@router.post("/events/{event_id}/memories", response_model=MemoryOut)
async def create_memory(
    event_id: str,
    body: CreateMemoryBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    content = body.content.strip()
    if not content and not body.photos:
        raise HTTPException(status_code=400, detail="Content or photos required")
    if len(content) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 characters")
    if len(body.photos) > 10:
        raise HTTPException(status_code=400, detail="Max 10 photos")

    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Must be host or approved attendee
    if event.host_id != user_id:
        approved = await db.execute(
            select(Rsvp).where(and_(
                Rsvp.event_id == event_id,
                Rsvp.user_id == user_id,
                Rsvp.status == "approved",
            ))
        )
        if not approved.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Only approved attendees can post memories")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    memory = EventMemory(
        id=generate(),
        event_id=event_id,
        user_id=user_id,
        content=content,
        photos=json.dumps(body.photos) if body.photos else None,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)

    return MemoryOut(
        id=memory.id,
        event_id=memory.event_id,
        content=memory.content,
        photos=body.photos,
        created_at=memory.created_at.isoformat(),
        author_id=user.id,
        author_name=user.name,
        author_image=user.profile_image,
    )


@router.delete("/memories/{memory_id}")
async def delete_memory(
    memory_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    memory = await db.get(EventMemory, memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    if memory.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your memory")

    await db.delete(memory)
    await db.commit()
    return {"ok": True}
