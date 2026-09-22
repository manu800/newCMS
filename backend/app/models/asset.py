from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.common import MongoBaseModel

ASSET_TYPES = ("image", "video", "audio")


class Asset(MongoBaseModel):
    name: str
    filename: str  # storage key: local disk filename, or S3 object key
    storage: str = "local"  # "local" or "s3" — which backend this file lives on
    url: str
    type: str  # one of ASSET_TYPES
    mime_type: str
    size: int  # bytes
    tags: list[str] = Field(default_factory=list)
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    credit: Optional[str] = None
    folder: str = "uploads"
    property_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
