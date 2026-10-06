from typing import Optional

from pydantic import BaseModel

from app.models.content_model import ContentModelField


class ContentModelUpdate(BaseModel):
    fields: Optional[list[ContentModelField]] = None
    show_in_sidebar: Optional[bool] = None


class ContentModelCreate(BaseModel):
    name: str
    content_type: str
    property_id: str


class RenameFieldKey(BaseModel):
    old_key: str
    new_key: str
