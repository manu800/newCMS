"""Idempotent dev/demo seed for the CMS-PWA platform.

Run with:  python -m app.scripts.seed
Clears and repopulates every collection with demo data so the full
CMS -> PWA demo flow (spec section 30) works immediately after seeding.
"""

import asyncio
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.database import COLLECTIONS, get_db
from app.core.security import hash_password

CATEGORIES = [
    {"id": "cat-politics", "name": "Politics", "slug": "politics"},
    {"id": "cat-sports", "name": "Sports", "slug": "sports"},
    {"id": "cat-entertainment", "name": "Entertainment", "slug": "entertainment"},
    {"id": "cat-technology", "name": "Technology", "slug": "technology"},
    {"id": "cat-lifestyle", "name": "Lifestyle", "slug": "lifestyle"},
    {"id": "cat-videos", "name": "Videos", "slug": "videos"},
]

PLACEHOLDER_IMG = "https://picsum.photos/seed/{seed}/800/450"

ARTICLE_TITLES = {
    "politics": [
        "Parliament passes new infrastructure bill",
        "Election commission announces poll schedule",
        "Opposition demands debate on economic policy",
        "State elections see record voter turnout",
    ],
    "sports": [
        "India wins the match in a thrilling final over",
        "Local football club clinches championship title",
        "Star athlete breaks national record at trials",
        "Cricket board announces new tournament format",
    ],
    "entertainment": [
        "New movie tops box office on opening weekend",
        "Popular streaming series renewed for another season",
        "Music festival lineup announced for this year",
        "Award ceremony celebrates the year's best films",
    ],
    "technology": [
        "Startup unveils AI-powered assistant for developers",
        "New smartphone launch breaks pre-order records",
        "Tech giant announces major cloud partnership",
        "Researchers demonstrate breakthrough battery tech",
    ],
    "lifestyle": [
        "Five habits for a healthier morning routine",
        "Chefs share their favorite monsoon recipes",
        "Travel guide: hidden gems for your next trip",
        "How remote work is reshaping city living",
    ],
    "videos": [
        "Watch: highlights from today's biggest story",
        "Explainer video: what the new policy means for you",
        "Behind the scenes of the season finale",
        "Top 10 moments from this week's news",
    ],
}

THEME_HOOK_MODERN = {
    "name": "Hook Modern",
    "slug": "hook-modern",
    "description": "Bold rose-and-slate design system with rounded cards.",
    "status": "draft",
    "design_tokens": {
        "colors": {
            "primary": "#E11D48",
            "secondary": "#0F172A",
            "background": "#FFFFFF",
            "surface": "#F8FAFC",
            "text": "#111827",
            "muted": "#64748B",
        },
        "typography": {"fontFamily": "Inter", "headingWeight": 700, "bodyWeight": 400},
        "spacing": {"xs": 4, "sm": 8, "md": 16, "lg": 24},
        "radius": {"small": 6, "medium": 12, "large": 20},
        "shadows": {
            "sm": "0 1px 2px rgba(0,0,0,0.05)",
            "md": "0 4px 6px rgba(0,0,0,0.1)",
            "lg": "0 10px 15px rgba(0,0,0,0.15)",
        },
        "breakpoints": {"mobile": 0, "tablet": 768, "desktop": 1024},
    },
    "component_mapping": {
        "hero": "split",
        "news_card": "vertical",
        "news_grid": "three_column",
        "carousel": "cards",
        "header": "default",
        "footer": "default",
        "bottom_navigation": "default",
    },
}

THEME_HOOK_CLASSIC = {
    "name": "Hook Classic",
    "slug": "hook-classic",
    "description": "Editorial navy-and-gold design system with a serif heading font.",
    "status": "draft",
    "design_tokens": {
        "colors": {
            "primary": "#B8860B",
            "secondary": "#001F3F",
            "background": "#FFFDF7",
            "surface": "#F5F0E6",
            "text": "#1A1A1A",
            "muted": "#6B6558",
        },
        "typography": {"fontFamily": "Georgia", "headingWeight": 700, "bodyWeight": 400},
        "spacing": {"xs": 4, "sm": 10, "md": 18, "lg": 28},
        "radius": {"small": 2, "medium": 4, "large": 8},
        "shadows": {
            "sm": "0 1px 2px rgba(0,0,0,0.08)",
            "md": "0 3px 8px rgba(0,0,0,0.12)",
            "lg": "0 8px 20px rgba(0,0,0,0.18)",
        },
        "breakpoints": {"mobile": 0, "tablet": 768, "desktop": 1024},
    },
    "component_mapping": {
        "hero": "centered",
        "news_card": "horizontal",
        "news_grid": "two_column",
        "carousel": "fullwidth",
        "header": "default",
        "footer": "minimal",
        "bottom_navigation": "default",
    },
}

THEME_HOOK_MOBILE = {
    "name": "Hook Mobile",
    "slug": "hook-mobile",
    "description": "Compact single-column layout tuned for small screens.",
    "status": "draft",
    "device_type": "mobile",
    "design_tokens": {
        "colors": {
            "primary": "#E11D48",
            "secondary": "#0F172A",
            "background": "#FFFFFF",
            "surface": "#F8FAFC",
            "text": "#111827",
            "muted": "#64748B",
        },
        "typography": {"fontFamily": "Inter", "headingWeight": 700, "bodyWeight": 400},
        "spacing": {"xs": 4, "sm": 8, "md": 12, "lg": 16},
        "radius": {"small": 8, "medium": 14, "large": 22},
        "shadows": {
            "sm": "0 1px 2px rgba(0,0,0,0.05)",
            "md": "0 4px 6px rgba(0,0,0,0.1)",
            "lg": "0 10px 15px rgba(0,0,0,0.15)",
        },
        "breakpoints": {"mobile": 0, "tablet": 768, "desktop": 1024},
    },
    "component_mapping": {
        "hero": "centered",
        "news_card": "horizontal",
        "news_grid": "two_column",
        "carousel": "cards",
        "header": "default",
        "footer": "minimal",
        "bottom_navigation": "default",
    },
}

THEME_HOOK_DESKTOP = {
    "name": "Hook Desktop",
    "slug": "hook-desktop",
    "description": "Wide multi-column layout tuned for large screens.",
    "status": "draft",
    "device_type": "desktop",
    "design_tokens": {
        "colors": {
            "primary": "#E11D48",
            "secondary": "#0F172A",
            "background": "#FFFFFF",
            "surface": "#F8FAFC",
            "text": "#111827",
            "muted": "#64748B",
        },
        "typography": {"fontFamily": "Inter", "headingWeight": 700, "bodyWeight": 400},
        "spacing": {"xs": 4, "sm": 8, "md": 16, "lg": 24},
        "radius": {"small": 6, "medium": 12, "large": 20},
        "shadows": {
            "sm": "0 1px 2px rgba(0,0,0,0.05)",
            "md": "0 4px 6px rgba(0,0,0,0.1)",
            "lg": "0 10px 15px rgba(0,0,0,0.15)",
        },
        "breakpoints": {"mobile": 0, "tablet": 768, "desktop": 1024},
    },
    "component_mapping": {
        "hero": "split",
        "news_card": "vertical",
        "news_grid": "four_column",
        "carousel": "fullwidth",
        "header": "default",
        "footer": "default",
        "bottom_navigation": "default",
    },
}

THEME_MINIMAL = {
    "name": "Minimal",
    "slug": "minimal",
    "description": "Grayscale, sharp-edged, distraction-free reading design.",
    "status": "draft",
    "design_tokens": {
        "colors": {
            "primary": "#111827",
            "secondary": "#374151",
            "background": "#FFFFFF",
            "surface": "#FAFAFA",
            "text": "#111111",
            "muted": "#9CA3AF",
        },
        "typography": {"fontFamily": "Helvetica", "headingWeight": 600, "bodyWeight": 400},
        "spacing": {"xs": 4, "sm": 8, "md": 14, "lg": 20},
        "radius": {"small": 0, "medium": 0, "large": 0},
        "shadows": {"sm": "none", "md": "none", "lg": "none"},
        "breakpoints": {"mobile": 0, "tablet": 768, "desktop": 1024},
    },
    "component_mapping": {
        "hero": "fullbleed",
        "news_card": "featured",
        "news_grid": "four_column",
        "carousel": "fullwidth",
        "header": "transparent",
        "footer": "minimal",
        "bottom_navigation": "floating",
    },
}

COMPONENT_DEFS = [
    {
        "name": "Hero", "slug": "hero", "type": "hero",
        "variants": [{"name": "Centered", "slug": "centered"}, {"name": "Split", "slug": "split"}, {"name": "Fullbleed", "slug": "fullbleed"}],
        "fields": [
            {"name": "title", "label": "Title", "type": "text", "required": True},
            {"name": "subtitle", "label": "Subtitle", "type": "textarea"},
            {"name": "image", "label": "Image", "type": "image"},
            {"name": "buttonText", "label": "Button Text", "type": "text"},
            {"name": "buttonUrl", "label": "Button URL", "type": "url"},
        ],
    },
    {
        "name": "Banner", "slug": "banner", "type": "banner",
        "variants": [{"name": "Full Width", "slug": "full_width"}, {"name": "Boxed", "slug": "boxed"}],
        "fields": [
            {"name": "image", "label": "Image", "type": "image", "required": True},
            {"name": "link", "label": "Link", "type": "url"},
            {"name": "altText", "label": "Alt Text", "type": "text"},
        ],
    },
    {
        "name": "News Card", "slug": "news-card", "type": "news_card",
        "variants": [{"name": "Horizontal", "slug": "horizontal"}, {"name": "Vertical", "slug": "vertical"}, {"name": "Featured", "slug": "featured"}],
        "fields": [
            {"name": "showSummary", "label": "Show Summary", "type": "boolean", "default": True},
            {"name": "showCategory", "label": "Show Category", "type": "boolean", "default": True},
        ],
    },
    {
        "name": "News List", "slug": "news-list", "type": "news_list",
        "variants": [{"name": "Compact", "slug": "compact"}, {"name": "Detailed", "slug": "detailed"}],
        "fields": [{"name": "showThumbnail", "label": "Show Thumbnail", "type": "boolean", "default": True}],
    },
    {
        "name": "News Grid", "slug": "news-grid", "type": "news_grid",
        "variants": [
            {"name": "Two Column", "slug": "two_column"},
            {"name": "Three Column", "slug": "three_column"},
            {"name": "Four Column", "slug": "four_column"},
        ],
        "fields": [{"name": "showExcerpt", "label": "Show Excerpt", "type": "boolean", "default": False}],
    },
    {
        "name": "Carousel", "slug": "carousel", "type": "carousel",
        "variants": [{"name": "Cards", "slug": "cards"}, {"name": "Full Width", "slug": "fullwidth"}],
        "fields": [
            {"name": "autoplay", "label": "Autoplay", "type": "boolean", "default": True},
            {"name": "interval", "label": "Interval (ms)", "type": "number", "default": 4000},
        ],
    },
    {
        "name": "Video", "slug": "video", "type": "video",
        "variants": [{"name": "Inline", "slug": "inline"}, {"name": "Modal", "slug": "modal"}],
        "fields": [
            {"name": "videoUrl", "label": "Video URL", "type": "video"},
            {"name": "poster", "label": "Poster Image", "type": "image"},
            {"name": "autoplay", "label": "Autoplay", "type": "boolean", "default": False},
        ],
    },
    {
        "name": "Image", "slug": "image-block", "type": "image",
        "variants": [{"name": "Default", "slug": "default"}, {"name": "Rounded", "slug": "rounded"}],
        "fields": [
            {"name": "image", "label": "Image", "type": "image", "required": True},
            {"name": "altText", "label": "Alt Text", "type": "text"},
            {"name": "link", "label": "Link", "type": "url"},
        ],
    },
    {
        "name": "Text", "slug": "text-block", "type": "text",
        "variants": [{"name": "Default", "slug": "default"}, {"name": "Highlighted", "slug": "highlighted"}],
        "fields": [
            {"name": "heading", "label": "Heading", "type": "text"},
            {"name": "body", "label": "Body", "type": "textarea"},
            {
                "name": "alignment", "label": "Alignment", "type": "select",
                "options": ["left", "center", "right"], "default": "left",
            },
        ],
    },
    {
        "name": "Category", "slug": "category-block", "type": "category",
        "variants": [{"name": "Pill", "slug": "pill"}, {"name": "Card", "slug": "card"}],
        "fields": [
            {"name": "category", "label": "Category", "type": "category"},
            {"name": "displayName", "label": "Display Name", "type": "text"},
        ],
    },
    {
        "name": "Ad", "slug": "ad", "type": "ad",
        "variants": [{"name": "Banner", "slug": "banner"}, {"name": "Native", "slug": "native"}],
        "fields": [
            {"name": "adSlotId", "label": "Ad Slot ID", "type": "text"},
            {
                "name": "size", "label": "Size", "type": "select",
                "options": ["300x250", "728x90", "320x50"], "default": "300x250",
            },
        ],
    },
    {
        "name": "Spacer", "slug": "spacer", "type": "spacer",
        "variants": [{"name": "Small", "slug": "small"}, {"name": "Medium", "slug": "medium"}, {"name": "Large", "slug": "large"}],
        "fields": [{"name": "height", "label": "Height (px)", "type": "number", "default": 24}],
    },
    {
        "name": "Header", "slug": "header", "type": "header",
        "variants": [{"name": "Default", "slug": "default"}, {"name": "Transparent", "slug": "transparent"}],
        "fields": [
            {"name": "showSearch", "label": "Show Search", "type": "boolean", "default": True},
            {"name": "showLogo", "label": "Show Logo", "type": "boolean", "default": True},
        ],
    },
    {
        "name": "Footer", "slug": "footer", "type": "footer",
        "variants": [{"name": "Default", "slug": "default"}, {"name": "Minimal", "slug": "minimal"}],
        "fields": [
            {"name": "showSocial", "label": "Show Social Links", "type": "boolean", "default": True},
            {"name": "copyrightText", "label": "Copyright Text", "type": "text"},
        ],
    },
    {
        "name": "Bottom Navigation", "slug": "bottom-navigation", "type": "bottom_navigation",
        "variants": [{"name": "Default", "slug": "default"}, {"name": "Floating", "slug": "floating"}],
        "fields": [{"name": "activeColor", "label": "Active Color", "type": "color"}],
    },
]


def build_articles() -> list[dict]:
    articles = []
    now = datetime.utcnow()
    order = 0
    for cat in CATEGORIES:
        for i, title in enumerate(ARTICLE_TITLES[cat["slug"]]):
            order += 1
            slug = f"{cat['slug']}-{i+1}-{title.lower()}"[:80]
            slug = "".join(c if c.isalnum() else "-" for c in slug).strip("-")
            while "--" in slug:
                slug = slug.replace("--", "-")
            is_video = cat["slug"] == "videos"
            articles.append(
                {
                    "language_code": "en",
                    "script_headline": title,
                    "script_slug": slug,
                    "script_summary": f"{title}. Full coverage and analysis from the Hook newsroom.",
                    "script_content": f"<p>{title}. This is placeholder seed content for the demo article.</p>",
                    "script_thumbnail": PLACEHOLDER_IMG.format(seed=slug),
                    "script_thumbnail_16_9": PLACEHOLDER_IMG.format(seed=slug + "-16x9"),
                    "parent_category": cat,
                    "child_category": None,
                    "other_categories": [],
                    "tags": [{"name": cat["name"], "slug": cat["slug"]}],
                    "article_type": "video" if is_video else "article",
                    "video_url": "https://www.w3schools.com/html/mov_bbb.mp4" if is_video else None,
                    "meta_title": title,
                    "meta_description": f"{title} - read more on Hook.",
                    "og_title": title,
                    "og_description": f"{title} - read more on Hook.",
                    "social_headline": title,
                    "social_caption": title,
                    "social_image": PLACEHOLDER_IMG.format(seed=slug),
                    "is_breaking": "true" if order in (1, 5) else "false",
                    "is_trending": order % 3 == 0,
                    "trending_order": order if order % 3 == 0 else None,
                    "show_on_web": True,
                    "show_on_app": True,
                    "is_searchable": True,
                    "script_status": True,
                    "is_deleted": "false",
                    "author": {
                        "name": "Hook Newsroom",
                        "slug": "hook-newsroom",
                        "authorDescription": "Editorial desk",
                        "userImage": "https://picsum.photos/seed/author/100/100",
                    },
                    "source": "hook",
                    "property_info": {
                        "property_id": 1, "name": "Hook", "slug": "hook",
                        "logo": "hook/logo.png", "host": "https://hook.online",
                    },
                    "disclaimer": "",
                    "slug_updated": False,
                    "slug_history": [],
                    "aspect_ratio": "16:9",
                    "publication_date": now - timedelta(hours=order),
                    "createdAt": now - timedelta(hours=order),
                    "updatedAt": now - timedelta(hours=order),
                }
            )
    return articles


def section(id_, type_, variant, title, data_source=None, columns=None, props=None):
    return {
        "id": id_,
        "type": type_,
        "variant": variant,
        "title": title,
        "data_source": data_source,
        "config": {
            "columns": columns or {"mobile": 1, "tablet": 2, "desktop": 3},
            "spacing": {"top": 20, "bottom": 20},
        },
        "props": props or {},
    }


async def main():
    db = get_db()

    print("Clearing existing collections...")
    for name in COLLECTIONS.values():
        await db[name].delete_many({})

    print("Seeding admin user...")
    await db[COLLECTIONS["users"]].insert_one(
        {
            "email": settings.seed_admin_email,
            "name": "Shailendra Singh",
            "password_hash": hash_password(settings.seed_admin_password),
            "role": "admin",
            "created_at": datetime.utcnow(),
        }
    )

    print("Seeding components...")
    now = datetime.utcnow()
    for c in COMPONENT_DEFS:
        await db[COLLECTIONS["components"]].insert_one({**c, "status": "active", "created_at": now, "updated_at": now})

    print("Seeding themes...")
    theme_ids = {}
    for theme in (THEME_HOOK_MODERN, THEME_HOOK_CLASSIC, THEME_MINIMAL, THEME_HOOK_MOBILE, THEME_HOOK_DESKTOP):
        result = await db[COLLECTIONS["themes"]].insert_one({**theme, "created_at": now, "updated_at": now})
        theme_ids[theme["slug"]] = str(result.inserted_id)
    await db[COLLECTIONS["themes"]].update_one({"slug": "hook-modern"}, {"$set": {"status": "active"}})

    print("Seeding properties...")
    properties = [
        {"property_id": 1, "name": "Hook", "slug": "hook", "logo": "hook/logo.png", "host": "https://hook.online"},
        {"property_id": 2, "name": "Hook Hindi", "slug": "hook-hindi", "logo": "hook/logo.png", "host": "https://hindi.hook.online"},
        {"property_id": 3, "name": "Hook English", "slug": "hook-english", "logo": "hook/logo.png", "host": "https://english.hook.online"},
    ]
    property_ids = {}
    for prop in properties:
        result = await db[COLLECTIONS["properties"]].insert_one(
            {**prop, "active_theme_id": theme_ids["hook-modern"], "active_home_page_id": None, "status": "active", "created_at": now, "updated_at": now}
        )
        property_ids[prop["slug"]] = str(result.inserted_id)
    hook_id = property_ids["hook"]

    await db[COLLECTIONS["properties"]].update_one(
        {"slug": "hook"},
        {
            "$set": {
                "theme_config": {
                    "mobile_theme_id": theme_ids["hook-mobile"],
                    "desktop_theme_id": theme_ids["hook-desktop"],
                }
            }
        },
    )

    print("Seeding navigation...")
    await db[COLLECTIONS["navigations"]].insert_one(
        {
            "property_id": hook_id,
            "type": "top_navigation",
            "items": [
                {"id": "nav-home", "label": "Home", "icon": "home", "url": "/", "order": 0},
                {"id": "nav-trending", "label": "Trending", "icon": "fire", "url": "/trending", "order": 1},
                {"id": "nav-sports", "label": "Sports", "icon": "trophy", "url": "/sports", "order": 2},
                {"id": "nav-entertainment", "label": "Entertainment", "icon": "film", "url": "/entertainment", "order": 3},
                {"id": "nav-videos", "label": "Videos", "icon": "play", "url": "/videos", "order": 4},
            ],
            "created_at": now, "updated_at": now,
        }
    )
    await db[COLLECTIONS["navigations"]].insert_one(
        {
            "property_id": hook_id,
            "type": "bottom_navigation",
            "items": [
                {"id": "bnav-home", "label": "Home", "icon": "home", "url": "/", "order": 0},
                {"id": "bnav-trending", "label": "Trending", "icon": "fire", "url": "/trending", "order": 1},
                {"id": "bnav-videos", "label": "Videos", "icon": "play", "url": "/videos", "order": 2},
                {"id": "bnav-search", "label": "Search", "icon": "search", "url": "/search", "order": 3},
            ],
            "created_at": now, "updated_at": now,
        }
    )

    print("Seeding articles...")
    articles = build_articles()
    await db[COLLECTIONS["articles"]].insert_many(articles)

    print("Seeding pages...")

    def published(sections):
        return {
            "sections": sections,
            "published_sections": sections,
            "status": "published",
            "published_at": now,
        }

    home_sections = [
        section("s1", "header", "default", None),
        section("s2", "hero", "split", "Top Story", {"type": "breaking", "limit": 1}),
        section("s3", "news_grid", "three_column", "Trending Now", {"type": "trending", "limit": 6}),
        section("s4", "carousel", "cards", "Sports", {"type": "category", "category_slug": "sports", "limit": 6}),
        section("s5", "news_list", "detailed", "Latest News", {"type": "latest", "limit": 8}),
        section("s6", "footer", "default", None),
    ]
    trending_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_grid", "three_column", "Trending", {"type": "trending", "limit": 12}),
        section("s3", "footer", "default", None),
    ]
    latest_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_list", "detailed", "Latest News", {"type": "latest", "limit": 15}),
        section("s3", "footer", "default", None),
    ]
    sports_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_grid", "two_column", "Sports", {"type": "category", "category_slug": "sports", "limit": 10}),
        section("s3", "footer", "default", None),
    ]
    entertainment_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_grid", "two_column", "Entertainment", {"type": "category", "category_slug": "entertainment", "limit": 10}),
        section("s3", "footer", "default", None),
    ]
    videos_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_grid", "two_column", "Videos", {"type": "video", "limit": 10}),
        section("s3", "footer", "default", None),
    ]
    article_detail_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_list", "compact", "Related", {"type": "latest", "limit": 4}),
        section("s3", "footer", "default", None),
    ]
    search_sections = [
        section("s1", "header", "default", None),
        section("s2", "news_list", "compact", "Search Results", {"type": "latest", "limit": 10}),
        section("s3", "footer", "default", None),
    ]

    pages = [
        {"name": "Home", "slug": "home", "type": "home", "sections": home_sections},
        {"name": "Trending", "slug": "trending", "type": "custom", "sections": trending_sections},
        {"name": "Latest News", "slug": "latest-news", "type": "custom", "sections": latest_sections},
        {"name": "Sports", "slug": "sports", "type": "category", "sections": sports_sections},
        {"name": "Entertainment", "slug": "entertainment", "type": "category", "sections": entertainment_sections},
        {"name": "Videos", "slug": "videos", "type": "video", "sections": videos_sections},
        {"name": "Article Detail", "slug": "article-detail", "type": "article", "sections": article_detail_sections},
        {"name": "Search", "slug": "search", "type": "search", "sections": search_sections},
    ]

    home_page_id = None
    for p in pages:
        doc = {
            "name": p["name"], "slug": p["slug"], "type": p["type"],
            "property_id": hook_id, "theme_id": theme_ids["hook-modern"],
            "seo": {"title": p["name"], "description": f"{p['name']} - Hook"},
            "created_at": now, "updated_at": now,
            **published(p["sections"]),
        }
        result = await db[COLLECTIONS["pages"]].insert_one(doc)
        if p["slug"] == "home":
            home_page_id = str(result.inserted_id)

    # One extra draft page to demonstrate draft vs published (spec section 21)
    await db[COLLECTIONS["pages"]].insert_one(
        {
            "name": "Weekend Special (Draft)", "slug": "weekend-special", "type": "custom",
            "property_id": hook_id, "theme_id": theme_ids["hook-modern"],
            "sections": [section("s1", "hero", "centered", "Weekend Special", {"type": "manual", "article_ids": []})],
            "published_sections": [],
            "status": "draft", "published_at": None,
            "seo": {"title": "Weekend Special", "description": "Draft page"},
            "created_at": now, "updated_at": now,
        }
    )

    await db[COLLECTIONS["properties"]].update_one(
        {"slug": "hook"}, {"$set": {"active_home_page_id": home_page_id}}
    )

    print("Done.")
    print(f"Admin login -> email: {settings.seed_admin_email}  password: {settings.seed_admin_password}")


if __name__ == "__main__":
    asyncio.run(main())
