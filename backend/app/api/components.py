from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.component_repo import component_repo
from app.repositories.version_repo import version_repo
from app.schemas.components import ComponentCreate, ComponentUpdate

router = APIRouter(prefix="/api/components", tags=["components"])


@router.get("")
async def list_components(user: dict = Depends(get_current_user)):
    return await component_repo.list()


@router.post("", dependencies=[Depends(require_role("designer"))])
async def create_component(body: ComponentCreate):
    return await component_repo.create(body.model_dump())


@router.get("/{component_id}")
async def get_component(component_id: str, user: dict = Depends(get_current_user)):
    component = await component_repo.get(component_id)
    if not component:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Component not found")
    return component


@router.put("/{component_id}", dependencies=[Depends(require_role("designer"))])
async def update_component(component_id: str, body: ComponentUpdate, user: dict = Depends(get_current_user)):
    previous = await component_repo.get(component_id)
    if not previous:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Component not found")
    component = await component_repo.update(component_id, body.model_dump(exclude_unset=True))
    await version_repo.create_snapshot("component", component_id, previous, user["email"])
    return component


@router.get("/{component_id}/versions")
async def list_component_versions(component_id: str, user: dict = Depends(get_current_user)):
    return await version_repo.list_for_entity("component", component_id)
