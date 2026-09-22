from typing import Any

from pydantic import BaseModel


class ContentItemCreate(BaseModel):
    content_type: str
    property_id: str
    data: dict[str, Any] = {}


class ContentItemUpdate(BaseModel):
    data: dict[str, Any]
