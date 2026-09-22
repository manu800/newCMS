from pydantic import BaseModel

from app.models.content_model import ContentModelField


class ContentModelUpdate(BaseModel):
    fields: list[ContentModelField]


class ContentModelCreate(BaseModel):
    name: str
    content_type: str
    property_id: str


class RenameFieldKey(BaseModel):
    old_key: str
    new_key: str
