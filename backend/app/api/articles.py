from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.article_repo import article_repo
from app.schemas.articles import ArticleCreate, ArticleUpdate

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("")
async def list_articles(
    category: str | None = None,
    tag: str | None = None,
    limit: int = 50,
    skip: int = 0,
    user: dict = Depends(get_current_user),
):
    filter_ = {}
    if category:
        filter_["parent_category.slug"] = category
    if tag:
        filter_["tags.slug"] = tag
    return await article_repo.list(filter_, limit=limit, skip=skip)


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
    article = await article_repo.get_by_slug(slug)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return article


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_article(body: ArticleCreate):
    return await article_repo.create(body.model_dump())


@router.get("/{article_id}")
async def get_article(article_id: str, user: dict = Depends(get_current_user)):
    article = await article_repo.get(article_id)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return article


@router.put("/{article_id}", dependencies=[Depends(require_role("editor"))])
async def update_article(article_id: str, body: ArticleUpdate):
    article = await article_repo.update(article_id, body.model_dump(exclude_unset=True))
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return article
