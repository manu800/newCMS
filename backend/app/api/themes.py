from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.models.theme import DesignTokens
from app.repositories.theme_repo import theme_repo
from app.repositories.version_repo import version_repo
from app.schemas.themes import ThemeCreate, ThemeUpdate
from app.services.publish_service import activate_theme

router = APIRouter(prefix="/api/themes", tags=["themes"])


@router.get("")
async def list_themes(user: dict = Depends(get_current_user)):
    return await theme_repo.list()


@router.post("", dependencies=[Depends(require_role("designer"))])
async def create_theme(body: ThemeCreate):
    data = body.model_dump()
    data["design_tokens"] = (body.design_tokens or DesignTokens()).model_dump()
    data["status"] = "draft"
    return await theme_repo.create(data)


@router.get("/{theme_id}")
async def get_theme(theme_id: str, user: dict = Depends(get_current_user)):
    theme = await theme_repo.get(theme_id)
    if not theme:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    return theme


@router.put("/{theme_id}", dependencies=[Depends(require_role("designer"))])
async def update_theme(theme_id: str, body: ThemeUpdate, user: dict = Depends(get_current_user)):
    previous = await theme_repo.get(theme_id)
    if not previous:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    theme = await theme_repo.update(theme_id, body.model_dump(exclude_unset=True))
    await version_repo.create_snapshot("theme", theme_id, previous, user["email"])
    return theme


@router.post("/{theme_id}/activate", dependencies=[Depends(require_role("designer"))])
async def activate(theme_id: str, property_id: str, user: dict = Depends(get_current_user)):
    return await activate_theme(theme_id, property_id, user["email"])


@router.get("/{theme_id}/versions")
async def theme_versions(theme_id: str, user: dict = Depends(get_current_user)):
    return await version_repo.list_for_entity("theme", theme_id)
