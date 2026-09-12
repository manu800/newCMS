from datetime import datetime
from typing import Optional

from app.models.common import MongoBaseModel

ENTITY_TYPES = ("theme", "page", "navigation")


class Version(MongoBaseModel):
    entity_type: str  # one of ENTITY_TYPES
    entity_id: str
    version: int
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    snapshot: dict
