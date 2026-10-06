from datetime import datetime
from typing import Optional

from app.models.common import MongoBaseModel

ROLES = ("admin", "editor", "designer", "viewer")


class User(MongoBaseModel):
    email: str
    name: str
    password_hash: str
    role: str = "viewer"
    avatar: Optional[str] = None
    designation: Optional[str] = None
    is_author: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
