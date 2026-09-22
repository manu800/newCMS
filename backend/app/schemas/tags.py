from typing import Optional

from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    slug: str
    property_id: str


class TagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
