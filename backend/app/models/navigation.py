from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.common import MongoBaseModel

NAV_TYPES = ("top_navigation", "bottom_navigation", "sidebar")


class NavItem(MongoBaseModel):
    id: str
    label: str
    icon: Optional[str] = None
    url: str
    order: int = 0


class Navigation(MongoBaseModel):
    property_id: str
    type: str  # one of NAV_TYPES
    items: list[NavItem] = Field(default_factory=list)

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
