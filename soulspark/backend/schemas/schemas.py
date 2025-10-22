from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class JournalCreate(BaseModel):
    content: str
    private: bool = False
    mood: Optional[str] = None
    title: Optional[str] = None


class JournalRead(BaseModel):
    id: int
    content: str
    created_at: datetime
    private: bool
    mood: Optional[str]
    title: Optional[str]

    class Config:
        from_attributes = True


class JournalUpdate(BaseModel):
    content: Optional[str] = None
    private: Optional[bool] = None
    mood: Optional[str] = None
    title: Optional[str] = None


class EncouragementRequest(BaseModel):
    mood: Optional[str] = None
    text: Optional[str] = None


class EncouragementResponse(BaseModel):
    verse: str
    message: str
    encouragement: str


class DailyVerseResponse(BaseModel):
    date: date
    reference: Optional[str]
    verse: str
    reflection: Optional[str]
    encouragement: Optional[str]


## Mass schemas removed for now
