from datetime import datetime
from typing import Optional

from app.models.common import MongoBaseModel


class ThemeConfig(MongoBaseModel):
    mobile_theme_id: Optional[str] = None
    desktop_theme_id: Optional[str] = None


class Property(MongoBaseModel):
    property_id: int = 1
    name: str
    slug: str
    logo: Optional[str] = None
    host: Optional[str] = None
    active_theme_id: Optional[str] = None
    active_home_page_id: Optional[str] = None
    theme_config: Optional[ThemeConfig] = None
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
