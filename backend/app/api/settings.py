from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.deps import get_current_user, require_role
from app.repositories.settings_repo import settings_repo

router = APIRouter(prefix="/api/settings", tags=["settings"])

SIDEBAR_ORDER_KEY = "sidebar_content_order"
SOURCE_TYPES_KEY = "page_builder_source_types"


class SidebarOrderBody(BaseModel):
    order: list[str]


class CustomSourceType(BaseModel):
    key: str
    label: str
    # When set, this source type resolves generically across every
    # content_type by matching data.<field> at use-time, rather than the
    # plain content_type-equality fallback every other custom type uses.
    field: str | None = None


class SourceTypesBody(BaseModel):
    enabled: list[str]
    custom: list[CustomSourceType] = []


@router.get("/sidebar-order")
async def get_sidebar_order(user: dict = Depends(get_current_user)):
    order = await settings_repo.get_value(SIDEBAR_ORDER_KEY, [])
    return {"order": order}


@router.put("/sidebar-order", dependencies=[Depends(require_role("admin"))])
async def set_sidebar_order(body: SidebarOrderBody):
    await settings_repo.set_value(SIDEBAR_ORDER_KEY, body.order)
    return {"order": body.order}


@router.get("/source-types")
async def get_source_types(user: dict = Depends(get_current_user)):
    """Which Page Builder "Source Type" options are offered, plus any
    admin-defined custom ones (not tied to a Content Model). An empty
    `enabled` list means unconfigured, i.e. every built-in type, Content
    Model, and custom entry is shown — same default-everything convention
    as sidebar-order."""
    value = await settings_repo.get_value(SOURCE_TYPES_KEY, {"enabled": [], "custom": []})
    if isinstance(value, list):
        # Pre-existing value from before "custom" entries existed — just a
        # bare enabled-keys list.
        value = {"enabled": value, "custom": []}
    return {"enabled": value.get("enabled", []), "custom": value.get("custom", [])}


@router.put("/source-types", dependencies=[Depends(require_role("admin"))])
async def set_source_types(body: SourceTypesBody):
    value = {"enabled": body.enabled, "custom": [c.model_dump() for c in body.custom]}
    await settings_repo.set_value(SOURCE_TYPES_KEY, value)
    return value
