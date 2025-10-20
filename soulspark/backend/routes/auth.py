from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
import secrets
import os

from ..auth import verify_google_id_token, create_access_token
from ..database import get_session
from ..models.user import User
from ..schemas.auth import GoogleAuthRequest, AuthResponse, UserOut
from pydantic import BaseModel
from sqlmodel import select

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=AuthResponse)
async def google_login(payload: GoogleAuthRequest) -> AuthResponse:
    info = verify_google_id_token(payload.id_token)
    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")

    with get_session() as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user is None:
            user = User(email=email, name=name, picture=picture)
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            user.name = name or user.name
            user.picture = picture or user.picture
            session.add(user)
            session.commit()

        token = create_access_token(sub=str(user.id), data={"uid": user.id, "email": user.email})
        return AuthResponse(access_token=token, user=UserOut(id=user.id, email=user.email, name=user.name, picture=user.picture))


class IssueRequest(BaseModel):
    email: str
    name: str | None = None
    picture: str | None = None


@router.post("/issue", response_model=AuthResponse)
async def issue_token(req: IssueRequest, request: Request) -> AuthResponse:
    """Issue a JWT for a user via server-side secret.

    Security: requires header `X-Admin-Secret` matching env `TOKEN_ISSUER_SECRET`.
    Intended for development or admin automation only.
    """
    admin_secret = os.getenv("TOKEN_ISSUER_SECRET", "")
    provided = request.headers.get("X-Admin-Secret", "")
    if not admin_secret or provided != admin_secret:
        raise HTTPException(status_code=403, detail="Forbidden")

    email = req.email.strip().lower()
    with get_session() as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user is None:
            user = User(email=email, name=req.name, picture=req.picture)
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            user.name = req.name or user.name
            user.picture = req.picture or user.picture
            session.add(user)
            session.commit()

        token = create_access_token(sub=str(user.id), data={"uid": user.id, "email": user.email})
        return AuthResponse(access_token=token, user=UserOut(id=user.id, email=user.email, name=user.name, picture=user.picture))


# Simple secret generator — returns a random long string
class SimpleGenRequest(BaseModel):
    email: str
    passphrase: str


@router.post("/generate", summary="Generate a random long string (e.g., JWT secret)")
async def generate_simple_secret(payload: SimpleGenRequest) -> dict:
    # Intentionally simple: require email + passphrase, return a random secret
    # No persistence; caller stores it wherever needed (e.g., env var).
    secret = secrets.token_urlsafe(64)
    return {"secret": secret}
