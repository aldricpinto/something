from __future__ import annotations

from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None
    picture: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

