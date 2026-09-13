from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.common import MongoBaseModel

FIELD_TYPES = (
    "text",
    "textarea",
    "number",
    "boolean",
    "select",
    "multiselect",
    "image",
    "video",
    "url",
    "color",
    "article",
    "category",
    "tag",
    "date",
    "datetime",
)

COMPONENT_TYPES = (
    "hero",
    "banner",
    "news_card",
    "news_list",
    "news_grid",
    "carousel",
    "video",
    "image",
    "text",
    "category",
    "ad",
    "spacer",
    "header",
    "footer",
    "bottom_navigation",
)


class ComponentField(MongoBaseModel):
    name: str
    label: str
    type: str  # one of FIELD_TYPES
    required: bool = False
    default: Optional[object] = None
    options: list[str] = Field(default_factory=list)  # for select/multiselect
    description: Optional[str] = None  # short help text shown under the field in the CMS


class ComponentVariant(MongoBaseModel):
    name: str
    slug: str


class DesignContract(MongoBaseModel):
    """Which design-override categories this component's PWA renderer supports.
    Gates which controls the CMS Design panel shows — a component only ever
    exposes overrides its actual React implementation reads."""

    typography: bool = False
    colors: bool = False
    spacing: bool = False
    border: bool = False
    shadow: bool = False
    cursor: bool = False
    layout: bool = False
    images: bool = False
    positioning: bool = False


class Component(MongoBaseModel):
    name: str
    slug: str
    type: str  # one of COMPONENT_TYPES
    variants: list[ComponentVariant] = Field(default_factory=list)
    fields: list[ComponentField] = Field(default_factory=list)
    design_contract: DesignContract = Field(default_factory=DesignContract)
    status: str = "active"

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
