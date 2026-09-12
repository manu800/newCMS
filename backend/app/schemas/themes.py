from typing import Literal, Optional

from pydantic import BaseModel

from app.models.theme import DesignTokens


class ThemeCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo: Optional[str] = None
    device_type: Optional[Literal["mobile", "desktop"]] = None
    design_tokens: Optional[DesignTokens] = None
    component_mapping: dict[str, str] = {}


class ThemeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    status: Optional[str] = None
    device_type: Optional[Literal["mobile", "desktop"]] = None
    design_tokens: Optional[DesignTokens] = None
    component_mapping: Optional[dict[str, str]] = None
