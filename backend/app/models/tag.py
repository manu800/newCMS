from datetime import datetime
from typing import Optional

from app.models.common import MongoBaseModel


class Tag(MongoBaseModel):
    """A reusable, CMS-managed tag — shared across Assets, Articles, and
    anywhere else in the CMS that tags content, so the same tag list stays
    consistent everywhere instead of each feature inventing its own."""

    name: str
    slug: str
    property_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
