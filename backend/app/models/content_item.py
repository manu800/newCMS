from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.models.common import MongoBaseModel


class ContentItem(MongoBaseModel):
    """A single data record of a custom content type — the generic
    counterpart to CommonArticle for types created via "+ New model" that
    don't have (and don't need) their own dedicated collection/schema."""

    content_type: str
    property_id: str
    data: dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
