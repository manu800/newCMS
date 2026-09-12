from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.common import MongoBaseModel

DATA_SOURCE_TYPES = (
    "latest",
    "trending",
    "breaking",
    "category",
    "tag",
    "manual",
    "video",
    "search",
)

PAGE_TYPES = ("home", "category", "article", "search", "video", "custom")


class DataSource(MongoBaseModel):
    type: str = "manual"  # one of DATA_SOURCE_TYPES
    limit: int = 10
    category_id: Optional[str] = None
    category_slug: Optional[str] = None
    tag: Optional[str] = None
    query: Optional[str] = None
    article_ids: list[str] = Field(default_factory=list)


class ResponsiveColumns(MongoBaseModel):
    mobile: int = 1
    tablet: int = 2
    desktop: int = 3


class SectionSpacing(MongoBaseModel):
    top: int = 20
    bottom: int = 20


class SectionConfig(MongoBaseModel):
    columns: ResponsiveColumns = Field(default_factory=ResponsiveColumns)
    spacing: SectionSpacing = Field(default_factory=SectionSpacing)


class DesignOverride(MongoBaseModel):
    """Per-device visual overrides for one section, layered on top of theme
    tokens at render time. All fields optional — unset means "use the theme
    default", never a hardcoded fallback baked in here."""

    font_size: Optional[int] = None
    font_weight: Optional[int] = None
    text_align: Optional[str] = None  # left | center | right
    text_color: Optional[str] = None
    background_color: Optional[str] = None
    padding_top: Optional[int] = None
    padding_right: Optional[int] = None
    padding_bottom: Optional[int] = None
    padding_left: Optional[int] = None
    border_radius: Optional[int] = None
    border_radius_top_left: Optional[int] = None
    border_radius_top_right: Optional[int] = None
    border_radius_bottom_right: Optional[int] = None
    border_radius_bottom_left: Optional[int] = None
    border_width: Optional[int] = None
    border_color: Optional[str] = None
    shadow: Optional[str] = None  # none | sm | md | lg
    cursor: Optional[str] = None  # auto | default | pointer | wait | text | move | grab | grabbing | crosshair | not-allowed | zoom-in | zoom-out | etc.

    # Layout
    display: Optional[str] = None  # block | flex | grid | inline-block
    flex_direction: Optional[str] = None  # row | column
    justify_content: Optional[str] = None  # flex-start | center | flex-end | space-between | space-around
    align_items: Optional[str] = None  # flex-start | center | flex-end | stretch
    gap: Optional[int] = None
    width: Optional[str] = None  # e.g. "100%", "320px"
    height: Optional[str] = None

    # Images
    object_fit: Optional[str] = None  # cover | contain | fill
    object_position: Optional[str] = None  # e.g. "center", "top", "50% 20%"
    lazy_loading: Optional[bool] = None

    # Positioning
    position: Optional[str] = None  # static | relative | absolute | sticky
    position_top: Optional[int] = None
    position_right: Optional[int] = None
    position_bottom: Optional[int] = None
    position_left: Optional[int] = None

    # Visibility (per-device — resolved server-side same as everything else here)
    hidden: Optional[bool] = None


class StructureElement(MongoBaseModel):
    """One named sub-element within a component (e.g. Hero's "title"). Array
    order in Section.structure IS the render order; enabled=False skips it."""

    element_id: str
    enabled: bool = True


class Section(MongoBaseModel):
    id: str
    type: str  # component type, must match a Component.type
    variant: Optional[str] = None
    title: Optional[str] = None
    data_source: Optional[DataSource] = None
    config: SectionConfig = Field(default_factory=SectionConfig)
    props: dict = Field(default_factory=dict)  # raw field values from Component.fields
    design: Optional[dict[str, DesignOverride]] = None  # keyed "mobile" | "desktop"
    structure: Optional[list[StructureElement]] = None  # unset = component's default order, all enabled


class SeoMeta(MongoBaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None


class Page(MongoBaseModel):
    name: str
    slug: str
    type: str = "custom"  # one of PAGE_TYPES
    property_id: str
    theme_id: Optional[str] = None
    status: str = "draft"  # draft | published | inactive

    sections: list[Section] = Field(default_factory=list)
    published_sections: list[Section] = Field(default_factory=list)

    seo: SeoMeta = Field(default_factory=SeoMeta)

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
