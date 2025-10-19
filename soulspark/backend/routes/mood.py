from __future__ import annotations

from fastapi import APIRouter

from ..schemas.schemas import EncouragementRequest, EncouragementResponse
from ..utils.ai import generate_encouragement

router = APIRouter(prefix="/encouragement", tags=["encouragement"])


@router.post("", response_model=EncouragementResponse)
async def get_encouragement(payload: EncouragementRequest) -> EncouragementResponse:
    res = generate_encouragement(mood=payload.mood, text=payload.text)
    return EncouragementResponse(**res)
