from __future__ import annotations

from datetime import date
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import get_session
from ..models.journal import DailyVerse
from ..schemas.schemas import DailyVerseResponse
from ..utils.ai import generate_ai_reflection

router = APIRouter(prefix="/verse", tags=["verse"])

BIBLE_API_URL = "https://beta.ourmanna.com/api/v1/get/?format=text"


def _parse_reference(verse_text: str) -> Optional[str]:
    # Try to split by ' - ' which often separates text from reference
    if " - " in verse_text:
        parts = verse_text.rsplit(" - ", 1)
        if len(parts) == 2 and len(parts[1].split()) <= 4:
            return parts[1].strip()
    # Otherwise try parentheses at end
    if verse_text.endswith(")") and "(" in verse_text:
        ref = verse_text[verse_text.rfind("(") + 1 : -1].strip()
        if ref:
            return ref
    return None


def _strip_reference_from_text(text: str, reference: Optional[str]) -> str:
    if not reference:
        return text.strip()
    # Pattern: "... verse text ... - Book Chapter:Verse" (possible translation in parens already in ref)
    if " - " in text:
        left, right = text.rsplit(" - ", 1)
        if right.strip() == reference:
            return left.strip()
    # Pattern: "... verse text ... (Book Chapter:Verse)"
    if text.endswith(")") and "(" in text and text[text.rfind("(") + 1 : -1].strip() == reference:
        return text[: text.rfind("(")].strip()
    return text.strip()


async def _fetch_bible_verse() -> tuple[str, Optional[str]]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(BIBLE_API_URL)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Bible API unavailable")
        text = resp.text.strip()
        reference = _parse_reference(text)
        clean_text = _strip_reference_from_text(text, reference)
        return clean_text, reference


@router.get("/today", response_model=DailyVerseResponse)
async def get_today_verse() -> DailyVerseResponse:
    today = date.today()
    with get_session() as session:
        stmt = select(DailyVerse).where(DailyVerse.date == today)
        existing = session.exec(stmt).first()
        if existing:
            display_text = _strip_reference_from_text(existing.verse_text or "", existing.reference)
            return DailyVerseResponse(
                date=existing.date,
                reference=existing.reference,
                verse=display_text,
                reflection=existing.reflection,
                encouragement=existing.encouragement,
            )

    # Not found: fetch new
    verse_text, reference = await _fetch_bible_verse()
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

    return DailyVerseResponse(
        date=today,
        reference=reference,
        verse=verse_text,
        reflection=dv.reflection,
        encouragement=dv.encouragement,
    )
