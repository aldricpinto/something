from __future__ import annotations

import os
from datetime import date

from fastapi import FastAPI
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import select

from .database import init_db, get_session
from .models.journal import DailyVerse
from .routes import verse as verse_routes
from .routes import mood as mood_routes
from .routes import journal as journal_routes
from .routes import auth as auth_routes
from .routes import qa as qa_routes
from .utils.ai import generate_ai_reflection

# Load environment variables from .env if present (local dev convenience).
# Be robust to where uvicorn is launched from.
# 1) Load from current working directory (project root), if any
load_dotenv(find_dotenv(usecwd=True), override=False)
# 2) Also load .env that sits next to this file (backend/.env)
_here_env = Path(__file__).with_name('.env')
load_dotenv(_here_env, override=False)

app = FastAPI(title="Manna API", version="1.0.0")

# CORS
frontend_origin = os.getenv("FRONTEND_ORIGIN")
origins = [frontend_origin] if frontend_origin else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(verse_routes.router)
app.include_router(mood_routes.router)
app.include_router(journal_routes.router)
app.include_router(auth_routes.router)
app.include_router(qa_routes.router)


scheduler: AsyncIOScheduler | None = None


async def ensure_today_verse() -> None:
    today = date.today()
    # Check exists
    with get_session() as session:
        existing = session.exec(select(DailyVerse).where(DailyVerse.date == today)).first()
        if existing:
            return
    # Fetch
    verse_text, reference = await verse_routes._fetch_bible_verse()
    ai = generate_ai_reflection(verse_text=verse_text, reference=reference)
    dv = DailyVerse(
        date=today,
        verse_text=verse_text,
        reference=reference,
        reflection=ai.get("reflection"),
        encouragement=ai.get("encouragement"),
    )
    with get_session() as session:
        session.add(dv)
        session.commit()


@app.on_event("startup")
async def on_startup():
    global scheduler
    init_db()
    # seed today's verse immediately
    await ensure_today_verse()

    # Start scheduler for daily refresh
    hour = int(os.getenv("VERSE_SCHEDULE_HOUR", "7"))
    minute = int(os.getenv("VERSE_SCHEDULE_MINUTE", "0"))
    scheduler = AsyncIOScheduler(timezone=os.getenv("TZ", "UTC"))
    trigger = CronTrigger(hour=hour, minute=minute)

    scheduler.add_job(ensure_today_verse, trigger, id="ensure_today_verse", replace_existing=True)
    scheduler.start()


@app.get("/health")
async def health():
    return {"ok": True}


# Uvicorn entrypoint hint: uvicorn soulspark.backend.main:app --reload
