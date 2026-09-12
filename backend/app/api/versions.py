from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.component_repo import component_repo
from app.repositories.navigation_repo import navigation_repo
from app.repositories.page_repo import page_repo
from app.repositories.theme_repo import theme_repo
from app.repositories.version_repo import version_repo

router = APIRouter(prefix="/api/versions", tags=["versions"])

REPO_BY_ENTITY = {
    "theme": theme_repo,
    "page": page_repo,
    "navigation": navigation_repo,
    "component": component_repo,
}


@router.get("/{entity_type}/{entity_id}")
async def list_versions(entity_type: str, entity_id: str, user: dict = Depends(get_current_user)):
    if entity_type not in REPO_BY_ENTITY:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown entity_type")
    return await version_repo.list_for_entity(entity_type, entity_id)


@router.post(
    "/{entity_type}/{entity_id}/{version}/restore",
    dependencies=[Depends(require_role("editor", "designer"))],
)
async def restore_version(entity_type: str, entity_id: str, version: int):
    if entity_type not in REPO_BY_ENTITY:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown entity_type")

    version_doc = await version_repo.get_version(entity_type, entity_id, version)
    if not version_doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")

    snapshot = dict(version_doc["snapshot"])
    snapshot.pop("id", None)
    snapshot.pop("_id", None)

    repo = REPO_BY_ENTITY[entity_type]
    return await repo.update(entity_id, snapshot)
