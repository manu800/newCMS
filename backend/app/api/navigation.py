from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.navigation_repo import navigation_repo
from app.repositories.version_repo import version_repo
from app.schemas.navigation import NavigationCreate, NavigationUpdate

router = APIRouter(prefix="/api/navigation", tags=["navigation"])


@router.get("")
async def list_navigation(property_id: str, user: dict = Depends(get_current_user)):
    return await navigation_repo.list_for_property(property_id)


@router.post("", dependencies=[Depends(require_role("designer", "editor"))])
async def create_navigation(body: NavigationCreate):
    return await navigation_repo.create(body.model_dump())


@router.put("/{navigation_id}", dependencies=[Depends(require_role("designer", "editor"))])
async def update_navigation(navigation_id: str, body: NavigationUpdate, user: dict = Depends(get_current_user)):
    previous = await navigation_repo.get(navigation_id)
    if not previous:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Navigation not found")
    nav = await navigation_repo.update(navigation_id, body.model_dump(exclude_unset=True))
    await version_repo.create_snapshot("navigation", navigation_id, previous, user["email"])
    return nav
