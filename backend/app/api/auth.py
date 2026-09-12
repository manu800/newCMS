from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.repositories.user_repo import user_repo
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    user = await user_repo.get_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_access_token(subject=user["email"], role=user["role"])
    user.pop("password_hash", None)
    return LoginResponse(access_token=token, user=user)


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    user.pop("password_hash", None)
    return user
