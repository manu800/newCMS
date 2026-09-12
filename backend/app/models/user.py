from datetime import datetime
from typing import Optional

from app.models.common import MongoBaseModel

ROLES = ("admin", "editor", "designer", "viewer")


class User(MongoBaseModel):
    email: str
    name: str
    password_hash: str
    role: str = "viewer"
    created_at: Optional[datetime] = None
