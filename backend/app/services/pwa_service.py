from fastapi import HTTPException, status

from app.repositories.navigation_repo import navigation_repo
from app.repositories.page_repo import page_repo
from app.repositories.property_repo import property_repo
from app.repositories.theme_repo import theme_repo
from app.services.page_service import resolve_sections


async def get_property_or_404(property_slug: str) -> dict:
    prop = await property_repo.get_by_slug(property_slug)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Property '{property_slug}' not found")
    return prop


async def build_pwa_config(property_slug: str, device: str = "desktop") -> dict:
    prop = await get_property_or_404(property_slug)

    theme_config = prop.get("theme_config") or {}
    device_theme_id = (
        theme_config.get("mobile_theme_id") if device == "mobile" else theme_config.get("desktop_theme_id")
    )
    theme_id = device_theme_id or prop.get("active_theme_id")

    theme = None
    if theme_id:
        theme = await theme_repo.get(theme_id)

    navs = await navigation_repo.list_for_property(prop["id"])
    navigation = {n["type"]: n["items"] for n in navs}

    return {
        "property": {
            "name": prop["name"],
            "slug": prop["slug"],
            "logo": prop.get("logo"),
            "host": prop.get("host"),
        },
        "theme": {
            "id": theme["id"] if theme else None,
            "name": theme["name"] if theme else None,
            "slug": theme["slug"] if theme else None,
            "tokens": theme["design_tokens"] if theme else {},
            "component_mapping": theme.get("component_mapping", {}) if theme else {},
        },
        "navigation": {
            "top": navigation.get("top_navigation", []),
            "bottom": navigation.get("bottom_navigation", []),
            "sidebar": navigation.get("sidebar", []),
        },
    }


async def _build_theme_and_nav(prop: dict, device: str) -> tuple[dict, dict]:
    theme_config = prop.get("theme_config") or {}
    device_theme_id = (
        theme_config.get("mobile_theme_id") if device == "mobile" else theme_config.get("desktop_theme_id")
    )
    theme_id = device_theme_id or prop.get("active_theme_id")

    theme = None
    if theme_id:
        theme = await theme_repo.get(theme_id)

    navs = await navigation_repo.list_for_property(prop["id"])
    navigation = {n["type"]: n["items"] for n in navs}

    theme_out = {
        "id": theme["id"] if theme else None,
        "name": theme["name"] if theme else None,
        "slug": theme["slug"] if theme else None,
        "tokens": theme["design_tokens"] if theme else {},
        "component_mapping": theme.get("component_mapping", {}) if theme else {},
    }
    navigation_out = {
        "top": navigation.get("top_navigation", []),
        "bottom": navigation.get("bottom_navigation", []),
        "sidebar": navigation.get("sidebar", []),
    }
    return theme_out, navigation_out


async def build_pwa_preview(page_id: str, device: str = "desktop") -> dict:
    page = await page_repo.get(page_id)
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")

    prop = await property_repo.get(page["property_id"])
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    theme_out, navigation_out = await _build_theme_and_nav(prop, device)
    resolved_sections = await resolve_sections(page.get("sections") or [], device)

    return {
        "property": {
            "name": prop["name"],
            "slug": prop["slug"],
            "logo": prop.get("logo"),
            "host": prop.get("host"),
        },
        "theme": theme_out,
        "navigation": navigation_out,
        "page": {
            "name": page["name"],
            "slug": page["slug"],
            "type": page["type"],
            "status": page["status"],
            "seo": page.get("seo", {}),
            "published_at": page.get("published_at"),
        },
        "sections": resolved_sections,
    }


async def build_pwa_page(property_slug: str, page_slug: str, device: str = "desktop") -> dict:
    prop = await get_property_or_404(property_slug)
    page = await page_repo.get_by_property_and_slug(prop["id"], page_slug)
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Page '{page_slug}' not found")

    sections = page.get("published_sections") or []
    resolved_sections = await resolve_sections(sections, device)

    return {
        "page": {
            "name": page["name"],
            "slug": page["slug"],
            "type": page["type"],
            "status": page["status"],
            "seo": page.get("seo", {}),
            "published_at": page.get("published_at"),
        },
        "sections": resolved_sections,
    }
