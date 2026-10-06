import re

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.article_field_catalog import ARTICLE_FIELD_CATALOG, default_article_fields
from app.core.deps import get_current_user, require_role
from app.repositories.content_item_repo import content_item_repo
from app.repositories.content_model_repo import content_model_repo
from app.schemas.content_models import ContentModelCreate, ContentModelUpdate, RenameFieldKey

router = APIRouter(prefix="/api/content-models", tags=["content-models"])

CATALOGS = {"article": ARTICLE_FIELD_CATALOG}
DEFAULT_NAMES = {"article": "Article"}
CONTENT_TYPE_RE = re.compile(r"^[a-z][a-z0-9_]*$")
FIELD_KEY_RE = re.compile(r"^[a-z][a-z0-9_]*$")


def _default_fields(content_type: str) -> list[dict]:
    if content_type == "article":
        return default_article_fields()
    raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown content_type: {content_type}")


@router.get("")
async def list_content_models(property_id: str, user: dict = Depends(get_current_user)):
    return await content_model_repo.list({"property_id": property_id})


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_content_model(body: ContentModelCreate):
    if body.content_type == "article":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, '"article" is reserved for the built-in Article type')
    if not CONTENT_TYPE_RE.match(body.content_type):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "content_type must start with a letter and contain only lowercase letters, digits, and underscores",
        )
    existing = await content_model_repo.get_for_property_and_type(body.property_id, body.content_type)
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A content model for this type already exists")
    data = {
        "name": body.name,
        "content_type": body.content_type,
        "property_id": body.property_id,
        "fields": [],
        "show_in_sidebar": False,
    }
    return await content_model_repo.create(data)


@router.get("/field-catalog")
async def field_catalog(content_type: str, user: dict = Depends(get_current_user)):
    catalog = CATALOGS.get(content_type)
    if catalog is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown content_type: {content_type}")
    return catalog


@router.get("/active")
async def active_content_model(
    property_id: str, content_type: str, user: dict = Depends(get_current_user)
):
    """The property's Content Model for this content type — auto-created on
    first access, seeded with every catalog field visible in catalog order,
    so an untouched property renders identically to the old hardcoded form."""
    existing = await content_model_repo.get_for_property_and_type(property_id, content_type)
    if existing:
        return existing
    data = {
        "name": DEFAULT_NAMES.get(content_type, content_type.title()),
        "content_type": content_type,
        "property_id": property_id,
        "fields": _default_fields(content_type),
        "show_in_sidebar": False,
    }
    return await content_model_repo.create(data)


@router.put("/{model_id}", dependencies=[Depends(require_role("editor"))])
async def update_content_model(model_id: str, body: ContentModelUpdate):
    data: dict = {}
    if body.fields is not None:
        data["fields"] = [f.model_dump() for f in body.fields]
    if body.show_in_sidebar is not None:
        data["show_in_sidebar"] = body.show_in_sidebar
    model = await content_model_repo.update(model_id, data)
    if not model:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Content model not found")
    return model


@router.put("/{model_id}/rename-field", dependencies=[Depends(require_role("editor"))])
async def rename_field_key(model_id: str, body: RenameFieldKey):
    """Renames a field's key on a custom Content Model and migrates every
    already-saved Content Item's data from the old key to the new one.
    Article's keys are fixed to its hardcoded schema and can't be renamed."""
    model = await content_model_repo.get(model_id)
    if not model:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Content model not found")
    if model["content_type"] == "article":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Article field keys can't be renamed")
    if not FIELD_KEY_RE.match(body.new_key):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Field key must start with a letter and contain only lowercase letters, digits, and underscores",
        )
    fields = model["fields"]
    if not any(f["key"] == body.old_key for f in fields):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Field not found")
    if body.new_key != body.old_key and any(f["key"] == body.new_key for f in fields):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A field with this key already exists")

    for f in fields:
        if f["key"] == body.old_key:
            f["key"] = body.new_key
    updated = await content_model_repo.update(model_id, {"fields": fields})

    if body.new_key != body.old_key:
        await content_item_repo.rename_data_key(
            model["property_id"], model["content_type"], body.old_key, body.new_key
        )

    return updated
