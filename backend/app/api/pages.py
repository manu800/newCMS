from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.page_repo import page_repo
from app.repositories.version_repo import version_repo
from app.schemas.pages import PageCreate, PageUpdate
from app.services.page_service import resolve_sections
from app.services.publish_service import duplicate_page, publish_page

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("")
async def list_pages(property_id: str | None = None, user: dict = Depends(get_current_user)):
    if property_id:
        return await page_repo.list_for_property(property_id)
    return await page_repo.list()


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_page(body: PageCreate):
    data = body.model_dump()
    data["status"] = "draft"
    data["published_sections"] = []
    return await page_repo.create(data)


@router.get("/{page_id}")
async def get_page(page_id: str, user: dict = Depends(get_current_user)):
    page = await page_repo.get(page_id)
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")
    return page


@router.put("/{page_id}", dependencies=[Depends(require_role("editor"))])
async def update_page(page_id: str, body: PageUpdate):
    page = await page_repo.update(page_id, body.model_dump(exclude_unset=True))
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")
    return page


@router.delete("/{page_id}", dependencies=[Depends(require_role("editor"))])
async def delete_page(page_id: str):
    ok = await page_repo.delete(page_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")
    return {"deleted": True}


@router.post("/{page_id}/publish", dependencies=[Depends(require_role("editor"))])
async def publish(page_id: str, user: dict = Depends(get_current_user)):
    return await publish_page(page_id, user["email"])


@router.post("/{page_id}/duplicate", dependencies=[Depends(require_role("editor"))])
async def duplicate(page_id: str):
    return await duplicate_page(page_id)


@router.get("/{page_id}/preview")
async def preview_page(
    page_id: str, device: Literal["mobile", "desktop"] = "desktop", user: dict = Depends(get_current_user)
):
    page = await page_repo.get(page_id)
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")
    return {"page": page, "sections": await resolve_sections(page.get("sections", []), device)}


@router.get("/{page_id}/versions")
async def page_versions(page_id: str, user: dict = Depends(get_current_user)):
    return await version_repo.list_for_entity("page", page_id)
