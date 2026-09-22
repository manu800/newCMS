from typing import Optional

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str
    slug: str
    property_id: str
    parent_id: Optional[str] = None
    order: int = 0
    thumbnail: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_tags: list[str] = Field(default_factory=list)
    look_book_summary: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    order: Optional[int] = None
    thumbnail: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_tags: Optional[list[str]] = None
    look_book_summary: Optional[str] = None


class CategoryPosition(BaseModel):
    """Where a drag-and-drop just dropped this category: which parent group
    (None = top-level) and which index within that group's children."""

    parent_id: Optional[str] = None
    index: int = 0
