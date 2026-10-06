import re

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.article_repo import article_repo
from app.repositories.content_item_repo import content_item_repo
from app.schemas.articles import ArticleCreate, ArticleUpdate

router = APIRouter(prefix="/api/articles", tags=["articles"])


def _flatten(item: dict) -> dict:
    """Reshapes a content_items-backed article (content_type="article") to
    look like a CommonArticle document, so callers (CMS list/edit, the PWA)
    don't need to know or care which collection it actually lives in."""
    return {"id": item["id"], **item["data"]}


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "article"


async def _slug_exists(slug: str) -> bool:
    if await content_item_repo.get_by({"content_type": "article", "data.script_slug": slug}):
        return True
    return bool(await article_repo.get_by_slug(slug))


async def _unique_slug(base: str) -> str:
    slug = _slugify(base)
    candidate = slug
    n = 2
    while await _slug_exists(candidate):
        candidate = f"{slug}-{n}"
        n += 1
    return candidate


@router.get("")
async def list_articles(
    category: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    limit: int = 50,
    skip: int = 0,
    user: dict = Depends(get_current_user),
):
    legacy_filter = {}
    new_filter = {"content_type": "article"}
    if category:
        legacy_filter["parent_category.slug"] = category
        new_filter["data.parent_category.slug"] = category
    if tag:
        legacy_filter["tags.slug"] = tag
        new_filter["data.tags.slug"] = tag
    if search:
        legacy_filter["script_headline"] = {"$regex": search, "$options": "i"}
        new_filter["data.script_headline"] = {"$regex": search, "$options": "i"}

    legacy = await article_repo.list(legacy_filter, limit=limit, skip=skip)
    new_items = await content_item_repo.list(new_filter, limit=limit, skip=skip)
    return [_flatten(i) for i in new_items] + legacy


@router.get("/trending")
async def trending_articles(limit: int = 10):
    return await article_repo.resolve_data_source({"type": "trending", "limit": limit})


@router.get("/latest")
async def latest_articles(limit: int = 10):
    return await article_repo.resolve_data_source({"type": "latest", "limit": limit})


@router.get("/category/{slug}")
async def articles_by_category(slug: str, limit: int = 10):
    return await article_repo.resolve_data_source(
        {"type": "category", "category_slug": slug, "limit": limit}
    )


@router.get("/slug/{slug}")
async def get_article_by_slug(slug: str):
    item = await content_item_repo.get_by({"content_type": "article", "data.script_slug": slug})
    if item:
        return _flatten(item)
    article = await article_repo.get_by_slug(slug)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return article


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_article(body: ArticleCreate):
    data = body.model_dump(exclude={"property_id"})
    if not body.property_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "property_id is required")
    # A slug is what makes an article openable at all (the PWA links to
    # /article/{slug}) — callers that create articles outside the CMS form
    # (scripts, imports, other services) don't reliably set one, so derive a
    # unique one from the headline whenever it's missing rather than leaving
    # the article silently unclickable.
    if not data.get("script_slug"):
        headline = data.get("script_headline") or "untitled"
        data["script_slug"] = await _unique_slug(headline)
    item = await content_item_repo.create(
        {"content_type": "article", "property_id": body.property_id, "data": data}
    )
    return _flatten(item)


@router.get("/{article_id}")
async def get_article(article_id: str, user: dict = Depends(get_current_user)):
    item = await content_item_repo.get(article_id)
    if item and item.get("content_type") == "article":
        return _flatten(item)
    article = await article_repo.get(article_id)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return article


@router.put("/{article_id}", dependencies=[Depends(require_role("editor"))])
async def update_article(article_id: str, body: ArticleUpdate):
    item = await content_item_repo.get(article_id)
    if item and item.get("content_type") == "article":
        changes = body.model_dump(exclude_unset=True, exclude={"property_id"})
        merged = {**item["data"], **changes}
        if not merged.get("script_slug"):
            headline = merged.get("script_headline") or "untitled"
            merged["script_slug"] = await _unique_slug(headline)
        updated = await content_item_repo.update(article_id, {"data": merged})
        return _flatten(updated)

    article = await article_repo.update(article_id, body.model_dump(exclude_unset=True, exclude={"property_id"}))
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return article
