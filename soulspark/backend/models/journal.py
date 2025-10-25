from __future__ import annotations

from datetime import datetime, timezone, date as Date
from typing import Optional
from sqlmodel import SQLModel, Field


class JournalEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    private: bool = Field(default=False, index=True)
    mood: Optional[str] = Field(default=None)
    title: Optional[str] = Field(default=None)


class DailyVerse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # Avoid name clash between field name and type annotation in Pydantic v2
    date: Date = Field(index=True, sa_column_kwargs={"unique": True})
    reference: Optional[str] = None
    verse_text: str
    reflection: Optional[str] = None
    encouragement: Optional[str] = None
