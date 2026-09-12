from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel


class PropertyInfo(BaseModel):
    property_id: int = 1
    name: str = "Hook"
    slug: str = "hook"
    logo: str = "hook/logo.png"
    host: str = "https://hook.online"


class Author(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: Optional[str] = None
    slug: Optional[str] = None
    authorDescription: Optional[str] = None
    userImage: Optional[str] = None

    class Config:
        populate_by_name = True


class SlugHistoryEntry(BaseModel):
    slug: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None


class CommonArticle(MongoBaseModel):
    """Field-for-field port of the existing Mongoose CommonArticleSchema."""

    language_code: Optional[str] = None
    script_thumbnail: Optional[str] = None
    script_slug: Optional[str] = None
    script_content: Optional[str] = None
    script_caption: Optional[str] = None
    script_highlights: Optional[str] = None
    script_summary: Optional[str] = None
    parent_category: Optional[dict] = None
    child_category: Optional[dict] = None
    other_categories: list[dict] = Field(default_factory=list)
    tags: list[dict] = Field(default_factory=list)
    script_meta: Optional[dict] = None
    update_action_meta: Optional[dict] = None
    video_meta: Optional[dict] = None
    meta_title: Optional[str] = None
    meta_keywords: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_url: Optional[str] = None
    meta_type: Optional[str] = None
    script_video_instructions: Optional[str] = None
    article_type: Optional[str] = None
    genere_type: Optional[str] = None
    video_orientation: Optional[str] = None
    video_priority: Optional[int] = None
    category_banner: Optional[str] = None
    duration: Optional[int] = None
    is_searchable: Optional[bool] = None
    show_on_app: Optional[bool] = None
    state_id: Optional[str] = None
    script_status: Optional[bool] = None
    disable_time: Optional[datetime] = None
    publish_meta: Optional[dict] = None
    is_deleted: Optional[str] = None
    is_breaking: Optional[str] = None
    is_dynamic: Optional[str] = None
    rendition_status: Optional[str] = None
    script_vertical_video_url: Optional[str] = None
    video_url: Optional[str] = None
    type: Optional[str] = None
    script_share_url: Optional[str] = None
    bucket_url: Optional[str] = None
    m3u8_name: Optional[str] = None
    rendition_name: Optional[str] = None
    mp3_name: Optional[str] = None
    rendition_thumbnail: Optional[str] = None
    rendition_duration: Optional[int] = None
    m3u8_response_json: Optional[str] = None
    rendition_size: Optional[int] = None
    m3u8_name_720_1280: Optional[str] = None
    rendition_720_1280_status: Optional[str] = None
    trending_status: Optional[int] = None
    script_thumbnail_16_9: Optional[str] = None
    script_thumbnail_2_1: Optional[str] = None
    show_on_web: Optional[bool] = None
    editorji_special: Optional[bool] = None
    m3u8_json_data: list[Any] = Field(default_factory=list)
    is_trending: Optional[bool] = False
    trending_order: Optional[int] = None
    script_audio_file_url: Optional[str] = None
    transcript_audio_url: Optional[str] = None
    polly_service_response: list[Any] = Field(default_factory=list)
    script_cards: list[dict] = Field(default_factory=list)
    astrology_cards: list[dict] = Field(default_factory=list)
    adjacent_scripts: list[dict] = Field(default_factory=list)

    author: Optional[Author] = None

    review_type: Optional[str] = None
    review_content: list[Any] = Field(default_factory=list)
    recipe_content: list[dict] = Field(default_factory=list)
    content_review_count: Optional[int] = None
    podcast_id: Optional[str] = None
    podcast_data: Optional[dict] = None
    script_headline: Optional[str] = None
    podcast_type: Optional[str] = None
    host: Optional[str] = None
    publication_date: Optional[datetime] = None
    disabling_date: Optional[datetime] = None
    season: Optional[int] = None
    episode: Optional[int] = None
    module: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted_by: Optional[str] = None
    model_type: Optional[str] = None
    related_scripts: list[Any] = Field(default_factory=list)
    audio_url: Optional[str] = None
    episode_number: Optional[int] = None
    poster_image_url: Optional[str] = None
    cloudinary_img_url: Optional[str] = None
    our_rating: Optional[str] = None
    best_rating: Optional[str] = None

    source: str = "hook"
    canonical_url: Optional[str] = None
    courtesy: Optional[str] = None

    property_info: PropertyInfo = Field(default_factory=PropertyInfo)

    disclaimer: str = ""
    social_headline: Optional[str] = None
    social_caption: Optional[str] = None
    social_image: Optional[str] = None

    slug_updated: bool = False
    slug_history: list[SlugHistoryEntry] = Field(default_factory=list)
    aspect_ratio: str = ""

    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
