from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.repositories.user_repo import user_repo
from app.schemas.users import UserCreate, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


def _strip_hash(user: dict) -> dict:
    user.pop("password_hash", None)
    return user


@router.get("")
async def list_users(is_author: Optional[bool] = None, user: dict = Depends(get_current_user)):
    filter_ = {"is_author": True} if is_author else None
    users = await user_repo.list(filter_)
    return [_strip_hash(u) for u in users]


@router.get("/{user_id}")
async def get_user(user_id: str, user: dict = Depends(get_current_user)):
    found = await user_repo.get(user_id)
    if not found:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _strip_hash(found)


@router.post("", dependencies=[Depends(require_role("admin"))])
async def create_user(body: UserCreate):
    existing = await user_repo.get_by_email(body.email)
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A user with this email already exists")
    data = body.model_dump(exclude={"password"})
    data["password_hash"] = hash_password(body.password)
    created = await user_repo.create(data)
    return _strip_hash(created)


@router.put("/{user_id}", dependencies=[Depends(require_role("admin"))])
async def update_user(user_id: str, body: UserUpdate):
    data = body.model_dump(exclude_unset=True, exclude={"password"})
    if body.password:
        data["password_hash"] = hash_password(body.password)
    updated = await user_repo.update(user_id, data)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _strip_hash(updated)


@router.delete("/{user_id}", dependencies=[Depends(require_role("admin"))])
async def delete_user(user_id: str, current: dict = Depends(get_current_user)):
    if user_id == current["id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can't delete your own account")
    deleted = await user_repo.delete(user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return {"ok": True}
