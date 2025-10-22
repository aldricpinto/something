from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlmodel import select

from ..database import get_session
from ..models.journal import JournalEntry
from ..schemas.schemas import JournalCreate, JournalRead, JournalUpdate
from ..utils.crypto import encrypt_text, decrypt_text, has_encryption, is_probably_encrypted
from ..auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=List[JournalRead])
async def list_entries(include_private: bool = True, user: User = Depends(get_current_user)) -> List[JournalRead]:
    with get_session() as session:
        stmt = select(JournalEntry).where(JournalEntry.user_id == user.id)
        if not include_private:
            stmt = stmt.where(JournalEntry.private == False)  # noqa: E712
        rows = session.exec(stmt.order_by(JournalEntry.created_at.desc())).all()
        out: List[JournalRead] = []
        for r in rows:
            out.append(
                JournalRead(
                    id=r.id,
                    content=decrypt_text(r.content),
                    created_at=r.created_at,
                    private=r.private,
                    mood=r.mood,
                    title=r.title,
                )
            )
        return out


@router.post("", response_model=JournalRead)
async def create_entry(payload: JournalCreate, user: User = Depends(get_current_user)) -> JournalRead:
    with get_session() as session:
        data = payload.model_dump()
        content_plain = data.pop("content", "")
        entry = JournalEntry(**data, user_id=user.id, content=encrypt_text(content_plain))
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return JournalRead(
            id=entry.id,
            content=content_plain,
            created_at=entry.created_at,
            private=entry.private,
            mood=entry.mood,
            title=entry.title,
        )


@router.get("/{entry_id}", response_model=JournalRead)
async def get_entry(entry_id: int, user: User = Depends(get_current_user)) -> JournalRead:
    with get_session() as session:
        entry = session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user.id:
            raise HTTPException(status_code=404, detail="Not found")
        return JournalRead(
            id=entry.id,
            content=decrypt_text(entry.content),
            created_at=entry.created_at,
            private=entry.private,
            mood=entry.mood,
            title=entry.title,
        )


@router.put("/{entry_id}", response_model=JournalRead)
async def update_entry(entry_id: int, payload: JournalUpdate, user: User = Depends(get_current_user)) -> JournalRead:
    with get_session() as session:
        entry = session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user.id:
            raise HTTPException(status_code=404, detail="Not found")
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            if k == "content" and isinstance(v, str):
                setattr(entry, k, encrypt_text(v))
            else:
                setattr(entry, k, v)
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return JournalRead(
            id=entry.id,
            content=decrypt_text(entry.content),
            created_at=entry.created_at,
            private=entry.private,
            mood=entry.mood,
            title=entry.title,
        )


@router.delete("/{entry_id}")
async def delete_entry(entry_id: int, user: User = Depends(get_current_user)) -> dict:
    with get_session() as session:
        entry = session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user.id:
            raise HTTPException(status_code=404, detail="Not found")
        session.delete(entry)
        session.commit()
        return {"ok": True}


@router.post("/migrate_encrypt")
async def migrate_encrypt(user: User = Depends(get_current_user)) -> dict:
    """Encrypt legacy plaintext entries for the current user.

    Only runs if encryption is configured. Skips entries that already look encrypted.
    """
    if not has_encryption():
        return {"updated": 0, "note": "encryption key not configured"}
    updated = 0
    with get_session() as session:
        rows = session.exec(select(JournalEntry).where(JournalEntry.user_id == user.id)).all()
        for r in rows:
            if not is_probably_encrypted(r.content or ""):
                r.content = encrypt_text(decrypt_text(r.content or ""))
                session.add(r)
                updated += 1
        if updated:
            session.commit()
    return {"updated": updated}
