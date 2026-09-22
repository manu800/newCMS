from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.common import MongoBaseModel


class ContentModelField(MongoBaseModel):
    key: str
    label: str
    type: str
    tab: str
    required: bool = False
    visible: bool = True
    order: int = 0
    options: Optional[list[str]] = None
    help_text: Optional[str] = None


class ContentModel(MongoBaseModel):
    """A property's schema for one content type's CMS form — currently only
    "article" is wired up to actually drive a form (ArticleForm); the
    content_type field exists so future content types can reuse the same
    shape without a redesign."""

    name: str
    content_type: str
    property_id: str
    fields: list[ContentModelField] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
