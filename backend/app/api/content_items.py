from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.content_item_repo import content_item_repo
from app.schemas.content_items import ContentItemCreate, ContentItemUpdate

router = APIRouter(prefix="/api/content-items", tags=["content-items"])


@router.get("")
async def list_content_items(property_id: str, content_type: str, user: dict = Depends(get_current_user)):
    return await content_item_repo.list_for_property_and_type(property_id, content_type)


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_content_item(body: ContentItemCreate):
    if body.content_type == "article":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Use the Articles page for article content")
    return await content_item_repo.create(body.model_dump())


@router.put("/{item_id}", dependencies=[Depends(require_role("editor"))])
async def update_content_item(item_id: str, body: ContentItemUpdate):
    item = await content_item_repo.update(item_id, {"data": body.data})
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Content item not found")
    return item


@router.delete("/{item_id}", dependencies=[Depends(require_role("editor"))])
async def delete_content_item(item_id: str):
    deleted = await content_item_repo.delete(item_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Content item not found")
    return {"ok": True}
