from datetime import datetime
from typing import Literal, Optional

from pydantic import Field

from app.models.common import MongoBaseModel


class ColorTokens(MongoBaseModel):
    primary: str = "#E11D48"
    secondary: str = "#0F172A"
    background: str = "#FFFFFF"
    surface: str = "#F8FAFC"
    text: str = "#111827"
    muted: str = "#64748B"


class TypographyTokens(MongoBaseModel):
    fontFamily: str = "Inter"
    headingWeight: int = 700
    bodyWeight: int = 400


class SpacingTokens(MongoBaseModel):
    xs: int = 4
    sm: int = 8
    md: int = 16
    lg: int = 24


class RadiusTokens(MongoBaseModel):
    small: int = 6
    medium: int = 12
    large: int = 20


class ShadowTokens(MongoBaseModel):
    sm: str = "0 1px 2px rgba(0,0,0,0.05)"
    md: str = "0 4px 6px rgba(0,0,0,0.1)"
    lg: str = "0 10px 15px rgba(0,0,0,0.15)"


class BreakpointTokens(MongoBaseModel):
    mobile: int = 0
    tablet: int = 768
    desktop: int = 1024


class DesignTokens(MongoBaseModel):
    colors: ColorTokens = Field(default_factory=ColorTokens)
    typography: TypographyTokens = Field(default_factory=TypographyTokens)
    spacing: SpacingTokens = Field(default_factory=SpacingTokens)
    radius: RadiusTokens = Field(default_factory=RadiusTokens)
    shadows: ShadowTokens = Field(default_factory=ShadowTokens)
    breakpoints: BreakpointTokens = Field(default_factory=BreakpointTokens)


class Theme(MongoBaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo: Optional[str] = None
    status: str = "draft"  # draft | active | inactive
    device_type: Optional[Literal["mobile", "desktop"]] = None

    design_tokens: DesignTokens = Field(default_factory=DesignTokens)
    component_mapping: dict[str, str] = Field(default_factory=dict)

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
