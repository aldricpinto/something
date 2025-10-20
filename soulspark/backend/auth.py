from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.oauth2 import id_token
from google.auth.transport import requests as grequests

from .database import get_session
from .models.user import User

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "43200"))  # 30 days
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


def create_access_token(sub: str, data: dict) -> str:
    now = datetime.now(tz=timezone.utc)
    payload = {"sub": sub, "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES), **data}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_google_id_token(token: str) -> dict:
    try:
        info = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID or None)
        return info
    except Exception as e:  # pragma: no cover - network validation
        raise HTTPException(status_code=401, detail="Invalid Google token") from e


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> User:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        uid = int(payload.get("uid"))
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=401, detail="Invalid token") from e

    from .database import Session, engine  # local import to avoid circular
    with get_session() as session:
        user = session.get(User, uid)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user

