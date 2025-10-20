from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlmodel import select

from ..database import get_session
from ..models.journal import JournalEntry
from ..schemas.schemas import JournalCreate, JournalRead, JournalUpdate
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
        return [JournalRead.model_validate(r) for r in rows]


@router.post("", response_model=JournalRead)
async def create_entry(payload: JournalCreate, user: User = Depends(get_current_user)) -> JournalRead:
    with get_session() as session:
        entry = JournalEntry(**payload.model_dump(), user_id=user.id)
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return JournalRead.model_validate(entry)


@router.get("/{entry_id}", response_model=JournalRead)
async def get_entry(entry_id: int, user: User = Depends(get_current_user)) -> JournalRead:
    with get_session() as session:
        entry = session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user.id:
            raise HTTPException(status_code=404, detail="Not found")
        return JournalRead.model_validate(entry)


@router.put("/{entry_id}", response_model=JournalRead)
async def update_entry(entry_id: int, payload: JournalUpdate, user: User = Depends(get_current_user)) -> JournalRead:
    with get_session() as session:
        entry = session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user.id:
            raise HTTPException(status_code=404, detail="Not found")
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(entry, k, v)
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return JournalRead.model_validate(entry)


@router.delete("/{entry_id}")
async def delete_entry(entry_id: int, user: User = Depends(get_current_user)) -> dict:
    with get_session() as session:
        entry = session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user.id:
            raise HTTPException(status_code=404, detail="Not found")
        session.delete(entry)
        session.commit()
        return {"ok": True}
