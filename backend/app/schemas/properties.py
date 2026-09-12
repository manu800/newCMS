from typing import Optional

from pydantic import BaseModel


class PropertyCreate(BaseModel):
    name: str
    slug: str
    logo: Optional[str] = None
    host: Optional[str] = None
    property_id: int = 1


class ThemeConfigUpdate(BaseModel):
    mobile_theme_id: Optional[str] = None
    desktop_theme_id: Optional[str] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo: Optional[str] = None
    host: Optional[str] = None
    active_theme_id: Optional[str] = None
    active_home_page_id: Optional[str] = None
    theme_config: Optional[ThemeConfigUpdate] = None
    status: Optional[str] = None
