from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from ..auth import get_current_user
from ..database import get_session
from ..models.journal import JournalEntry
from ..models.user import User
from ..utils.ai import generate_journal_answer, generate_entry_answer
from ..utils.crypto import decrypt_text


class AskRequest(BaseModel):
    question: str
    entry_id: int | None = None


class AskResponse(BaseModel):
    answer: str


router = APIRouter(prefix="/journal/ask", tags=["journal"])


@router.post("", response_model=AskResponse)
async def ask(payload: AskRequest, user: User = Depends(get_current_user)) -> AskResponse:
    q = payload.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question required")
    with get_session() as session:
        if payload.entry_id:
            entry = session.get(JournalEntry, payload.entry_id)
            if not entry or entry.user_id != user.id:
                raise HTTPException(status_code=404, detail="Entry not found")
            text = decrypt_text(entry.content or "")
        else:
            # Concatenate last 20 entries for context
            rows = session.exec(
                select(JournalEntry).where(JournalEntry.user_id == user.id).order_by(JournalEntry.created_at.desc()).limit(20)
            ).all()
            text = "\n---\n".join([decrypt_text(r.content) for r in rows if r and r.content])
    if payload.entry_id:
        answer = generate_entry_answer(q, text)
    else:
        answer = generate_journal_answer(q, text)
    return AskResponse(answer=answer)
