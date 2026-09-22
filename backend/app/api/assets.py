import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import get_current_user, require_role
from app.core.s3 import delete_from_s3, upload_to_s3
from app.repositories.article_repo import article_repo
from app.repositories.asset_repo import asset_repo
from app.repositories.category_repo import category_repo

router = APIRouter(prefix="/api/assets", tags=["assets"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50MB


class AssetUpdate(BaseModel):
    name: str | None = None
    tags: list[str] | None = None
    alt_text: str | None = None
    caption: str | None = None
    credit: str | None = None
    folder: str | None = None


def _asset_type_for(mime_type: str) -> str:
    for kind in ("image", "video", "audio"):
        if mime_type.startswith(f"{kind}/"):
            return kind
    raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unsupported file type: {mime_type}")


@router.get("")
async def list_assets(property_id: str, user: dict = Depends(get_current_user)):
    return await asset_repo.list_for_property(property_id)


@router.get("/folders")
async def list_folders(property_id: str, user: dict = Depends(get_current_user)):
    """Distinct folder names in use for this property — the only options
    the frontend dropdown can pick from."""
    folders = await asset_repo.collection.distinct("folder", {"property_id": property_id})
    if "uploads" not in folders:
        folders.append("uploads")
    return sorted(folders)


@router.post("/upload", dependencies=[Depends(require_role("editor"))])
async def upload_asset(
    request: Request,
    file: UploadFile = File(...),
    property_id: str = Form(...),
    name: str = Form(""),
    tags: str = Form(""),  # comma-separated tag names/slugs
    alt_text: str = Form(""),
    caption: str = Form(""),
    credit: str = Form(""),
    folder: str = Form("uploads"),
):
    mime_type = file.content_type or "application/octet-stream"
    asset_type = _asset_type_for(mime_type)

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File exceeds the 50MB upload limit")

    suffix = Path(file.filename or "").suffix
    stored_key = f"{uuid.uuid4().hex}{suffix}"

    if settings.s3_enabled:
        url = upload_to_s3(contents, stored_key, mime_type)
        storage = "s3"
    else:
        (UPLOAD_DIR / stored_key).write_bytes(contents)
        url = f"{str(request.base_url).rstrip('/')}/uploads/{stored_key}"
        storage = "local"

    data = {
        "name": name or (file.filename or stored_key),
        "filename": stored_key,
        "storage": storage,
        "url": url,
        "type": asset_type,
        "mime_type": mime_type,
        "size": len(contents),
        "tags": [t.strip() for t in tags.split(",") if t.strip()],
        "alt_text": alt_text or None,
        "caption": caption or None,
        "credit": credit or None,
        "folder": folder or "uploads",
        "property_id": property_id,
    }
    return await asset_repo.create(data)


@router.put("/{asset_id}", dependencies=[Depends(require_role("editor"))])
async def update_asset(asset_id: str, body: AssetUpdate):
    asset = await asset_repo.update(asset_id, body.model_dump(exclude_unset=True))
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    return asset


@router.get("/{asset_id}/usage")
async def asset_usage(asset_id: str, user: dict = Depends(get_current_user)):
    """Where this asset's URL is actually referenced right now — Article
    thumbnails and Category thumbnails, the two structured places an asset
    URL can be attached (page-section image props are free-form and not
    scanned)."""
    asset = await asset_repo.get(asset_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    url = asset["url"]

    items = []
    async for a in article_repo.collection.find(
        {"$or": [{"script_thumbnail": url}, {"script_thumbnail_16_9": url}]}
    ):
        items.append({"type": "article", "name": a.get("script_headline") or "Untitled article"})
    async for c in category_repo.collection.find({"thumbnail": url}):
        items.append({"type": "category", "name": c.get("name") or "Untitled category"})

    return {"count": len(items), "items": items}


@router.delete("/{asset_id}", dependencies=[Depends(require_role("editor"))])
async def delete_asset(asset_id: str):
    asset = await asset_repo.get(asset_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    if asset.get("storage") == "s3":
        delete_from_s3(asset["filename"])
    else:
        file_path = UPLOAD_DIR / asset["filename"]
        if file_path.exists():
            file_path.unlink()
    await asset_repo.delete(asset_id)
    return {"ok": True}
