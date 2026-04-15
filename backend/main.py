from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import events, rsvp, users, host, feed, memories, admin

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


app.include_router(events.router)
app.include_router(rsvp.router)
app.include_router(users.router)
app.include_router(host.router)
app.include_router(feed.router)
app.include_router(memories.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"ok": True}
