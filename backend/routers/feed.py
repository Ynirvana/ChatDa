from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from pydantic import BaseModel
from nanoid import generate

from database import get_db, Post, PostLike, PostComment, User
from auth import get_current_user_id, get_current_user_email, is_admin_email

router = APIRouter(prefix="/feed", tags=["feed"])

bearer = HTTPBearer(auto_error=False)


def optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str | None:
    if not credentials:
        return None
    from jose import jwt, JWTError
    from settings import settings
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.nextauth_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload.get("sub")
    except JWTError:
        return None


class CreatePostBody(BaseModel):
    content: str


class PostOut(BaseModel):
    id: str
    content: str
    created_at: str
    author_id: str
    author_name: str
    author_image: str | None
    author_nationality: str | None
    like_count: int
    liked_by_me: bool
    comment_count: int


class CommentOut(BaseModel):
    id: str
    post_id: str
    parent_id: str | None
    content: str
    created_at: str
    author_id: str
    author_name: str
    author_image: str | None


class CreateCommentBody(BaseModel):
    content: str
    parent_id: str | None = None


@router.get("/posts", response_model=list[PostOut])
async def list_posts(
    viewer_id: str | None = Depends(optional_user_id),
    db: AsyncSession = Depends(get_db),
):
    like_count_sq = (
        select(PostLike.post_id, func.count(PostLike.id).label("cnt"))
        .group_by(PostLike.post_id)
        .subquery()
    )
    comment_count_sq = (
        select(PostComment.post_id, func.count(PostComment.id).label("ccnt"))
        .group_by(PostComment.post_id)
        .subquery()
    )

    rows = await db.execute(
        select(
            Post, User,
            func.coalesce(like_count_sq.c.cnt, 0).label("like_count"),
            func.coalesce(comment_count_sq.c.ccnt, 0).label("comment_count"),
        )
        .join(User, Post.user_id == User.id)
        .outerjoin(like_count_sq, Post.id == like_count_sq.c.post_id)
        .outerjoin(comment_count_sq, Post.id == comment_count_sq.c.post_id)
        .order_by(Post.created_at.desc())
        .limit(100)
    )
    posts_data = rows.all()

    liked_ids: set[str] = set()
    if viewer_id and posts_data:
        post_ids = [p.id for p, _, _, _ in posts_data]
        liked_result = await db.execute(
            select(PostLike.post_id)
            .where(and_(PostLike.user_id == viewer_id, PostLike.post_id.in_(post_ids)))
        )
        liked_ids = {row[0] for row in liked_result.all()}

    return [
        PostOut(
            id=post.id,
            content=post.content,
            created_at=post.created_at.isoformat(),
            author_id=user.id,
            author_name=user.name,
            author_image=user.profile_image,
            author_nationality=user.nationality,
            like_count=int(like_count),
            liked_by_me=post.id in liked_ids,
            comment_count=int(comment_count),
        )
        for post, user, like_count, comment_count in posts_data
    ]


@router.post("/posts", response_model=PostOut)
async def create_post(
    body: CreatePostBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content required")
    if len(content) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 characters")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    post = Post(id=generate(), user_id=user_id, content=content)
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return PostOut(
        id=post.id,
        content=post.content,
        created_at=post.created_at.isoformat(),
        author_id=user.id,
        author_name=user.name,
        author_image=user.profile_image,
        author_nationality=user.nationality,
        like_count=0,
        liked_by_me=False,
        comment_count=0,
    )


@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(PostLike).where(and_(PostLike.post_id == post_id, PostLike.user_id == user_id))
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.execute(
            delete(PostLike).where(and_(PostLike.post_id == post_id, PostLike.user_id == user_id))
        )
        liked = False
    else:
        db.add(PostLike(id=generate(), post_id=post_id, user_id=user_id))
        liked = True

    await db.commit()
    return {"liked": liked}


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != user_id and not is_admin_email(email):
        raise HTTPException(status_code=403, detail="Not your post")

    await db.delete(post)
    await db.commit()
    return {"ok": True}


@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
async def list_comments(
    post_id: str,
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(PostComment, User)
        .join(User, PostComment.user_id == User.id)
        .where(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
    )
    return [
        CommentOut(
            id=c.id,
            post_id=c.post_id,
            parent_id=c.parent_id,
            content=c.content,
            created_at=c.created_at.isoformat(),
            author_id=u.id,
            author_name=u.name,
            author_image=u.profile_image,
        )
        for c, u in rows.all()
    ]


@router.post("/posts/{post_id}/comments", response_model=CommentOut)
async def create_comment(
    post_id: str,
    body: CreateCommentBody,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content required")
    if len(content) > 500:
        raise HTTPException(status_code=400, detail="Max 500 characters")

    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Validate parent exists and belongs to this post
    if body.parent_id:
        parent = await db.get(PostComment, body.parent_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    comment = PostComment(
        id=generate(),
        post_id=post_id,
        user_id=user_id,
        parent_id=body.parent_id,
        content=content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        parent_id=comment.parent_id,
        content=comment.content,
        created_at=comment.created_at.isoformat(),
        author_id=user.id,
        author_name=user.name,
        author_image=user.profile_image,
    )


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    user_id: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email),
    db: AsyncSession = Depends(get_db),
):
    comment = await db.get(PostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != user_id and not is_admin_email(email):
        raise HTTPException(status_code=403, detail="Not your comment")

    await db.delete(comment)
    await db.commit()
    return {"ok": True}
