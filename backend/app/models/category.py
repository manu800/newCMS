from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.common import MongoBaseModel


class Category(MongoBaseModel):
    """A taxonomy entry. `parent_id` unset = a top-level (parent) category;
    set = a subcategory of that parent. Only two levels are supported,
    matching CommonArticle's existing `parent_category`/`child_category`
    shape — articles still just embed {name, slug} copies, never a live
    reference, so deleting a category never touches existing articles."""

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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
