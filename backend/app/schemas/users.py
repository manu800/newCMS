from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "viewer"
    avatar: Optional[str] = None
    designation: Optional[str] = None
    is_author: bool = False
    is_active: bool = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    designation: Optional[str] = None
    is_author: Optional[bool] = None
    is_active: Optional[bool] = None
