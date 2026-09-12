from typing import Literal

from fastapi import APIRouter

from app.core.cache import cache_get, cache_set
from app.services.pwa_service import build_pwa_config, build_pwa_page, build_pwa_preview

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
