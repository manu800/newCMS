from datetime import datetime
from typing import Optional

from app.models.common import MongoBaseModel


class PwaTarget(MongoBaseModel):
    """A PWA deployment the CMS Page Builder's Preview dialog can point at.

    Lets the same CMS drive multiple, independently-built PWA/app codebases
    (each implementing the same /preview/{page_id} contract) without hardcoding
    their URLs in frontend source.
    """

    name: str
    url: str
    notes: Optional[str] = None
    is_default: bool = False
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
