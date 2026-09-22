from typing import Literal

from fastapi import APIRouter, Body, Depends

from app.core.cache import cache_get, cache_set
from app.core.deps import get_current_user
from app.services.pwa_service import (
    build_article_draft_preview,
    build_pwa_config,
    build_pwa_page,
    build_pwa_preview,
    create_article_draft,
)

router = APIRouter(prefix="/api/pwa", tags=["pwa"])


@router.get("/config/{property_slug}")
async def pwa_config(property_slug: str, device: Literal["mobile", "desktop"] = "desktop"):
    cache_key = f"pwa:config:{property_slug}:{device}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    result = await build_pwa_config(property_slug, device)
    await cache_set(cache_key, result)
    return result


@router.get("/page/{property_slug}/{page_slug}")
async def pwa_page(property_slug: str, page_slug: str, device: Literal["mobile", "desktop"] = "desktop"):
    cache_key = f"pwa:page:{property_slug}:{page_slug}:{device}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    result = await build_pwa_page(property_slug, page_slug, device)
    await cache_set(cache_key, result)
    return result


@router.get("/preview/{page_id}")
async def pwa_preview(page_id: str, device: Literal["mobile", "desktop"] = "desktop"):
    return await build_pwa_preview(page_id, device)


@router.post("/draft-article")
async def draft_article(
    body: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    """Stashes the article form's current (possibly unsaved) values and
    returns a token the PWA app can fetch to render a real preview."""
    token = await create_article_draft(body["property_id"], body["data"])
    return {"token": token}


@router.get("/preview/article/{token}")
async def pwa_article_preview(token: str, device: Literal["mobile", "desktop"] = "desktop"):
    return await build_article_draft_preview(token, device)
