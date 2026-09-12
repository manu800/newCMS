from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.database import COLLECTIONS, get_db
from app.core.security import decode_access_token
from app.models.common import doc_out

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    db = get_db()
    user = await db[COLLECTIONS["users"]].find_one({"email": payload.get("sub")})
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return doc_out(user)


def require_role(*allowed_roles: str):
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] != "admin" and user["role"] not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _check
