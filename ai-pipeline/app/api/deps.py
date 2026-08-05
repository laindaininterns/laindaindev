"""Shared FastAPI dependencies, currently just internal service auth.

The Node monolith authenticates its own users, this service only needs
to verify that a call is actually coming from the monolith and not from
the open internet. It sends the shared secret as X-Service-Key.
"""

from fastapi import Header, HTTPException, status

from app.config import get_settings

settings = get_settings()


async def require_service_key(x_service_key: str = Header(...)) -> None:
    if x_service_key != settings.service_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service key")
