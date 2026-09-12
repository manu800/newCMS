from typing import Optional

from pydantic import BaseModel, ConfigDict


class ArticleCreate(BaseModel):
    """Curated subset of CommonArticle exposed in the CMS form; extra fields pass through."""

    model_config = ConfigDict(extra="allow")

    script_headline: Optional[str] = None
    script_slug: Optional[str] = None
    script_content: Optional[str] = None
    script_summary: Optional[str] = None
    script_thumbnail: Optional[str] = None
    script_thumbnail_16_9: Optional[str] = None
    parent_category: Optional[dict] = None
    child_category: Optional[dict] = None
    tags: list[dict] = []
    article_type: Optional[str] = "article"
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    social_headline: Optional[str] = None
    social_caption: Optional[str] = None
    social_image: Optional[str] = None
    video_url: Optional[str] = None
    video_orientation: Optional[str] = None
    is_breaking: Optional[str] = "false"
    is_trending: Optional[bool] = False
    trending_order: Optional[int] = None
    show_on_web: Optional[bool] = True
    show_on_app: Optional[bool] = True
    script_status: Optional[bool] = True
    language_code: Optional[str] = "en"


class ArticleUpdate(ArticleCreate):
    pass
