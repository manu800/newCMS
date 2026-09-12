from typing import Optional

from pydantic import BaseModel

from app.models.page import Section, SeoMeta


class PageCreate(BaseModel):
    name: str
    slug: str
    type: str = "custom"
    property_id: str
    theme_id: Optional[str] = None
    sections: list[Section] = []
    seo: Optional[SeoMeta] = None


class PageUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    type: Optional[str] = None
    theme_id: Optional[str] = None
    sections: Optional[list[Section]] = None
    seo: Optional[SeoMeta] = None
    status: Optional[str] = None
