from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.tag_repo import tag_repo
from app.schemas.tags import TagCreate, TagUpdate

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("")
async def list_tags(property_id: str, user: dict = Depends(get_current_user)):
    return await tag_repo.list_for_property(property_id)


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_tag(body: TagCreate):
    existing = await tag_repo.get_by({"property_id": body.property_id, "slug": body.slug})
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A tag with this slug already exists")
    return await tag_repo.create(body.model_dump())


@router.put("/{tag_id}", dependencies=[Depends(require_role("editor"))])
async def update_tag(tag_id: str, body: TagUpdate):
    tag = await tag_repo.update(tag_id, body.model_dump(exclude_unset=True))
    if not tag:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tag not found")
    return tag


@router.delete("/{tag_id}", dependencies=[Depends(require_role("editor"))])
async def delete_tag(tag_id: str):
    deleted = await tag_repo.delete(tag_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tag not found")
    return {"ok": True}
