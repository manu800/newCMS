from typing import Optional

from pydantic import BaseModel


class PwaTargetCreate(BaseModel):
    name: str
    url: str
    notes: Optional[str] = None
    is_default: bool = False


class PwaTargetUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    is_default: Optional[bool] = None
    status: Optional[str] = None
