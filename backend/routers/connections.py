from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from nanoid import generate

from database import get_db, User, Connection
from auth import get_current_user_id

router = APIRouter(prefix="/connections", tags=["connections"])


class ConnectRequest(BaseModel):
    recipient_id: str = Field(min_length=1, max_length=50)


@router.post("", status_code=201)
async def send_request(
    body: ConnectRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if body.recipient_id == user_id:
        raise HTTPException(400, "Cannot connect with yourself")

    recipient = await db.get(User, body.recipient_id)
    if not recipient:
        raise HTTPException(404, "User not found")

    existing = (await db.execute(
        select(Connection).where(
            or_(
                and_(Connection.requester_id == user_id, Connection.recipient_id == body.recipient_id),
                and_(Connection.requester_id == body.recipient_id, Connection.recipient_id == user_id),
            )
        )
    )).scalars().first()

    if existing:
        if existing.status == "accepted":
            return {"ok": True, "status": "already_connected"}
        if existing.status == "pending":
            return {"ok": True, "status": "already_pending"}
        if existing.status == "rejected":
            existing.status = "pending"
            existing.requester_id = user_id
            existing.recipient_id = body.recipient_id
            await db.commit()
            return {"ok": True, "status": "re_requested"}

    conn = Connection(
        id=generate(),
        requester_id=user_id,
        recipient_id=body.recipient_id,
    )
    db.add(conn)
    await db.commit()
    return {"ok": True, "status": "sent", "connection_id": conn.id}


@router.get("")
async def my_connections(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(Connection).where(
            or_(Connection.requester_id == user_id, Connection.recipient_id == user_id)
        )
    )).scalars().all()

    return {
        "connections": [
            {
                "id": c.id,
                "requester_id": c.requester_id,
                "recipient_id": c.recipient_id,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in rows
        ]
    }


@router.get("/pending")
async def pending_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Incoming connection requests waiting for my response."""
    rows = (await db.execute(
        select(Connection, User.name, User.profile_image, User.nationality, User.status)
        .join(User, Connection.requester_id == User.id)
        .where(Connection.recipient_id == user_id, Connection.status == "pending")
        .order_by(Connection.created_at.desc())
    )).all()

    return {
        "pending": [
            {
                "connection_id": c.id,
                "requester_id": c.requester_id,
                "requester_name": name,
                "requester_image": image,
                "requester_nationality": nat,
                "requester_status": st,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c, name, image, nat, st in rows
        ]
    }


@router.put("/{connection_id}")
async def respond(
    connection_id: str,
    action: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if action not in ("accept", "reject"):
        raise HTTPException(400, "action must be 'accept' or 'reject'")

    conn = await db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(404, "Connection not found")
    if conn.recipient_id != user_id:
        raise HTTPException(403, "Not your request to respond to")
    if conn.status != "pending":
        raise HTTPException(400, f"Already {conn.status}")

    conn.status = "accepted" if action == "accept" else "rejected"
    await db.commit()
    return {"ok": True, "status": conn.status}
