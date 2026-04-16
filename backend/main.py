from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import jwt, JWTError

from routers import events, rsvp, users, host, feed, memories, admin, connections
from settings import settings
from database import SessionLocal, BannedEmail
from auth import is_admin_email

MAX_BODY_SIZE = 15 * 1024 * 1024  # 15 MiB

app = FastAPI(title="ChatDa API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://chatda.life",
        "https://www.chatda.life",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    cl = request.headers.get("content-length")
    if cl and int(cl) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Payload too large"})
    return await call_next(request)


@app.middleware("http")
async def reject_banned(request: Request, call_next):
    """If the request carries a JWT whose email is in banned_emails, short-circuit 403.
    Admins are never blocked (belt-and-suspenders — ban endpoint already refuses to ban admin emails).
    """
    auth = request.headers.get("authorization") or ""
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                settings.nextauth_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            email = payload.get("email")
            if email and not is_admin_email(email):
                async with SessionLocal() as session:
                    if await session.get(BannedEmail, email.strip().lower()):
                        return JSONResponse(status_code=403, content={"detail": "Banned"})
        except JWTError:
            pass  # Let downstream handle invalid JWT
    return await call_next(request)


app.include_router(events.router)
app.include_router(rsvp.router)
app.include_router(users.router)
app.include_router(host.router)
app.include_router(feed.router)
app.include_router(memories.router)
app.include_router(admin.router)
app.include_router(connections.router)


@app.get("/health")
async def health():
    return {"ok": True}
