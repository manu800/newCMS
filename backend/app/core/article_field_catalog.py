"""The fixed set of Article fields a Content Model is allowed to reference.

`CommonArticle` (backend/app/models/common_article.py) has ~100 legacy
fields, but the CMS Article form only ever exposed 27 of them. This catalog
is exactly those 27 — a Content Model can show/hide/reorder/require them,
not invent new ones. Order/tab/required here match the form's original
hardcoded layout, so a freshly auto-created Content Model renders
identically to the old hardcoded form.
"""

ARTICLE_FIELD_CATALOG = [
    {"key": "script_headline", "label": "Headline", "type": "text", "tab": "content", "required": True},
    {"key": "script_slug", "label": "Slug", "type": "text", "tab": "content", "required": False},
    {"key": "script_summary", "label": "Summary", "type": "textarea", "tab": "content", "required": False},
    {"key": "script_content", "label": "Content", "type": "textarea", "tab": "content", "required": False},
    {"key": "script_thumbnail", "label": "Thumbnail URL", "type": "image", "tab": "content", "required": False},
    {
        "key": "script_thumbnail_16_9",
        "label": "Thumbnail (16:9) URL",
        "type": "image",
        "tab": "content",
        "required": False,
    },
    {"key": "parent_category", "label": "Category", "type": "category", "tab": "content", "required": False},
    {"key": "child_category", "label": "Subcategory", "type": "category", "tab": "content", "required": False},
    {"key": "tags", "label": "Tags", "type": "tag", "tab": "content", "required": False},
    {
        "key": "article_type",
        "label": "Article Type",
        "type": "select",
        "tab": "content",
        "required": False,
        "options": ["article", "video"],
    },
    {"key": "video_url", "label": "Video URL", "type": "video", "tab": "content", "required": False},
    {
        "key": "video_orientation",
        "label": "Video Orientation",
        "type": "select",
        "tab": "content",
        "required": False,
        "options": ["landscape", "portrait"],
    },
    {"key": "social_headline", "label": "Social Headline", "type": "text", "tab": "content", "required": False},
    {"key": "social_caption", "label": "Social Caption", "type": "textarea", "tab": "content", "required": False},
    {"key": "social_image", "label": "Social Image URL", "type": "image", "tab": "content", "required": False},
    {"key": "meta_title", "label": "Meta Title", "type": "text", "tab": "seo_aeo", "required": False},
    {"key": "meta_description", "label": "Meta Description", "type": "textarea", "tab": "seo_aeo", "required": False},
    {"key": "meta_keywords", "label": "Meta Keywords", "type": "text", "tab": "seo_aeo", "required": False},
    {"key": "og_title", "label": "OG Title", "type": "text", "tab": "seo_aeo", "required": False},
    {"key": "og_description", "label": "OG Description", "type": "textarea", "tab": "seo_aeo", "required": False},
    {"key": "script_status", "label": "Published", "type": "boolean", "tab": "metadata", "required": False},
    {"key": "show_on_web", "label": "Show on Web", "type": "boolean", "tab": "metadata", "required": False},
    {"key": "show_on_app", "label": "Show on App", "type": "boolean", "tab": "metadata", "required": False},
    {
        "key": "is_breaking",
        "label": "Breaking News",
        "type": "select",
        "tab": "metadata",
        "required": False,
        "options": ["true", "false"],
    },
    {"key": "is_trending", "label": "Trending", "type": "boolean", "tab": "metadata", "required": False},
    {"key": "trending_order", "label": "Trending Order", "type": "number", "tab": "metadata", "required": False},
    {"key": "language_code", "label": "Language Code", "type": "text", "tab": "metadata", "required": False},
]

TAB_LABELS = {
    "content": "Content",
    "seo_aeo": "SEO & AEO",
    "metadata": "Metadata",
}


def default_article_fields() -> list[dict]:
    """The seed field list for a freshly auto-created Article content model —
    every catalog field, visible, in catalog order."""
    return [{**f, "visible": True, "order": i} for i, f in enumerate(ARTICLE_FIELD_CATALOG)]
