from __future__ import annotations

from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field


class JournalEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    private: bool = Field(default=False, index=True)
    mood: Optional[str] = Field(default=None)
    title: Optional[str] = Field(default=None)


class DailyVerse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: date = Field(index=True, unique=True)
    reference: Optional[str] = None
    verse_text: str
    reflection: Optional[str] = None
    encouragement: Optional[str] = None
