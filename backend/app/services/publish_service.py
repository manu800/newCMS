from datetime import datetime

from fastapi import HTTPException, status

from app.core.cache import cache_clear_prefix
from app.repositories.page_repo import page_repo
from app.repositories.property_repo import property_repo
from app.repositories.theme_repo import theme_repo
from app.repositories.version_repo import version_repo


async def publish_page(page_id: str, user_email: str | None) -> dict:
    page = await page_repo.get(page_id)
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")

    now = datetime.utcnow()
    await page_repo.collection.update_one(
        {"_id": page_repo.to_object_id(page_id)},
        {
            "$set": {
                "published_sections": page.get("sections", []),
                "status": "published",
                "published_at": now,
                "updated_at": now,
            }
        },
    )
    await version_repo.create_snapshot("page", page_id, page, user_email)
    await cache_clear_prefix("pwa:")
    return await page_repo.get(page_id)


async def duplicate_page(page_id: str) -> dict:
    page = await page_repo.get(page_id)
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")
    page.pop("id", None)
    page["name"] = f"{page['name']} (Copy)"
    page["slug"] = f"{page['slug']}-copy-{int(datetime.utcnow().timestamp())}"
    page["status"] = "draft"
    page["published_sections"] = []
    page["published_at"] = None
    return await page_repo.create(page)


async def activate_theme(theme_id: str, property_id: str, user_email: str | None) -> dict:
    theme = await theme_repo.get(theme_id)
    if not theme:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    prop = await property_repo.get(property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    await theme_repo.update(theme_id, {"status": "active"})
    await property_repo.update(property_id, {"active_theme_id": theme_id})

    await version_repo.create_snapshot("theme", theme_id, theme, user_email)
    await cache_clear_prefix("pwa:")
    return await theme_repo.get(theme_id)
