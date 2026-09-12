from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.pwa_target_repo import pwa_target_repo
from app.schemas.pwa_targets import PwaTargetCreate, PwaTargetUpdate

router = APIRouter(prefix="/api/pwa-targets", tags=["pwa-targets"])


@router.get("")
async def list_pwa_targets(user: dict = Depends(get_current_user)):
    return await pwa_target_repo.list()


@router.post("", dependencies=[Depends(require_role("admin"))])
async def create_pwa_target(body: PwaTargetCreate):
    return await pwa_target_repo.create(body.model_dump())


@router.get("/{target_id}")
async def get_pwa_target(target_id: str, user: dict = Depends(get_current_user)):
    target = await pwa_target_repo.get(target_id)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "PWA target not found")
    return target


@router.put("/{target_id}", dependencies=[Depends(require_role("admin"))])
async def update_pwa_target(target_id: str, body: PwaTargetUpdate):
    target = await pwa_target_repo.update(target_id, body.model_dump(exclude_unset=True))
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "PWA target not found")
    return target


@router.delete("/{target_id}", dependencies=[Depends(require_role("admin"))])
async def delete_pwa_target(target_id: str):
    deleted = await pwa_target_repo.delete(target_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "PWA target not found")
    return {"ok": True}
