from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.property_repo import property_repo
from app.repositories.theme_repo import theme_repo
from app.schemas.properties import PropertyCreate, PropertyUpdate

router = APIRouter(prefix="/api/properties", tags=["properties"])


@router.get("")
async def list_properties(user: dict = Depends(get_current_user)):
    return await property_repo.list()


@router.post("", dependencies=[Depends(require_role("admin"))])
async def create_property(body: PropertyCreate):
    return await property_repo.create(body.model_dump())


@router.get("/{property_id}")
async def get_property(property_id: str, user: dict = Depends(get_current_user)):
    prop = await property_repo.get(property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    return prop


async def _validate_theme_config(theme_config: dict) -> None:
    checks = [
        ("mobile_theme_id", "mobile"),
        ("desktop_theme_id", "desktop"),
    ]
    for field, expected_device in checks:
        theme_id = theme_config.get(field)
        if not theme_id:
            continue
        theme = await theme_repo.get(theme_id)
        if not theme:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{field}: theme not found")
        if theme.get("device_type") != expected_device:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"{field}: theme '{theme['name']}' must have device_type='{expected_device}'",
            )


@router.put("/{property_id}", dependencies=[Depends(require_role("admin"))])
async def update_property(property_id: str, body: PropertyUpdate):
    data = body.model_dump(exclude_unset=True)
    if data.get("theme_config"):
        await _validate_theme_config(data["theme_config"])
    prop = await property_repo.update(property_id, data)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    return prop
