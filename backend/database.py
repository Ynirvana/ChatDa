from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Boolean, Text, Enum as SAEnum, TIMESTAMP, Date, func, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from datetime import date
from typing import Any, AsyncGenerator
from settings import settings

engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=10,
    max_overflow=5,
    pool_timeout=20,
    echo=False,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


# ── PostgreSQL enum types (create_type=False = already exist in DB) ──

_platform_enum = SAEnum(
    'linkedin', 'instagram', 'x', 'tiktok', 'snapchat', 'whatsapp', 'kakao', 'facebook', 'threads',
    name='platform', create_type=False,
)

_rsvp_status_enum = SAEnum(
    'pending', 'approved', 'rejected', 'cancelled',
    name='rsvp_status', create_type=False,
)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)  # synced = first_name + " " + last_name
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    google_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    nationality: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    location_district: Mapped[str | None] = mapped_column(String, nullable=True)
    school: Mapped[str | None] = mapped_column(String, nullable=True)
    gender: Mapped[str | None] = mapped_column(String, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    show_personal_info: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default='true')
    status: Mapped[str | None] = mapped_column(String, nullable=True)  # v4: text (application-level validation)
    country_of_residence: Mapped[str] = mapped_column(String, nullable=False, server_default='KR')
    looking_for: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')
    looking_for_custom: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Step 2 — 프로필 페이지에서 채움
    stay_arrived: Mapped[date | None] = mapped_column(Date, nullable=True)
    stay_departed: Mapped[date | None] = mapped_column(Date, nullable=True)
    languages: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default='[]')
    interests: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image: Mapped[str | None] = mapped_column(Text, nullable=True)  # Primary (= profile_images[0])
    profile_images: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, server_default='{}')
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class SocialLink(Base):
    __tablename__ = "social_links"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    platform: Mapped[str] = mapped_column(_platform_enum, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[str] = mapped_column(String, nullable=False)
    time: Mapped[str] = mapped_column(String, nullable=False)
    end_time: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str] = mapped_column(String, nullable=False)
    area: Mapped[str | None] = mapped_column(String, nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    fee: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_map_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    naver_map_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    directions: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    payment_method: Mapped[str | None] = mapped_column(String, nullable=True)
    fee_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    host_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class PostLike(Base):
    __tablename__ = "post_likes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    post_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class PostComment(Base):
    __tablename__ = "post_comments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    post_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    parent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class EventMemory(Base):
    __tablename__ = "event_memories"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    photos: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class Rsvp(Base):
    __tablename__ = "rsvps"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(_rsvp_status_enum, default="pending")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


_tag_category_enum = SAEnum('can_do', 'looking_for', name='tag_category', create_type=False)
_connection_status_enum = SAEnum('pending', 'accepted', 'rejected', name='connection_status', create_type=False)


class UserTag(Base):
    __tablename__ = "user_tags"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    tag: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(_tag_category_enum, nullable=False)


class Connection(Base):
    __tablename__ = "connections"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    requester_id: Mapped[str] = mapped_column(String, nullable=False)
    recipient_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(_connection_status_enum, default="pending")
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class BannedEmail(Base):
    __tablename__ = "banned_emails"

    email: Mapped[str] = mapped_column(String, primary_key=True)
    banned_at = mapped_column(TIMESTAMP, server_default=func.now())
    banned_by: Mapped[str | None] = mapped_column(String, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class InviteToken(Base):
    __tablename__ = "invite_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    token: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    invite_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("nextval('invite_tokens_invite_number_seq'::regclass)"),
    )
    created_by_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())
    expires_at = mapped_column(TIMESTAMP, nullable=False)
    claimed_by_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    claimed_at = mapped_column(TIMESTAMP, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
