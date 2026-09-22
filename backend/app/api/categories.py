from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.repositories.article_repo import article_repo
from app.repositories.category_repo import category_repo
from app.schemas.categories import CategoryCreate, CategoryPosition, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
async def list_categories(property_id: str, user: dict = Depends(get_current_user)):
    categories = await category_repo.list_for_property(property_id)
    counts = await article_repo.collection.aggregate(
        [
            {"$match": {"$or": [{"parent_category.slug": {"$exists": True}}, {"child_category.slug": {"$exists": True}}]}},
            {
                "$facet": {
                    "parents": [
                        {"$match": {"parent_category.slug": {"$ne": None}}},
                        {"$group": {"_id": "$parent_category.slug", "count": {"$sum": 1}}},
                    ],
                    "children": [
                        {"$match": {"child_category.slug": {"$ne": None}}},
                        {"$group": {"_id": "$child_category.slug", "count": {"$sum": 1}}},
                    ],
                }
            },
        ]
    ).to_list(1)
    count_by_slug: dict[str, int] = {}
    if counts:
        for row in counts[0].get("parents", []):
            count_by_slug[row["_id"]] = count_by_slug.get(row["_id"], 0) + row["count"]
        for row in counts[0].get("children", []):
            count_by_slug[row["_id"]] = count_by_slug.get(row["_id"], 0) + row["count"]
    for c in categories:
        c["item_count"] = count_by_slug.get(c["slug"], 0)
    return categories


@router.post("", dependencies=[Depends(require_role("editor"))])
async def create_category(body: CategoryCreate):
    data = body.model_dump()
    if not data.get("order"):
        data["order"] = await category_repo.collection.count_documents(
            {"property_id": data["property_id"], "parent_id": data.get("parent_id")}
        )
    return await category_repo.create(data)


@router.put("/{category_id}", dependencies=[Depends(require_role("editor"))])
async def update_category(category_id: str, body: CategoryUpdate):
    category = await category_repo.update(category_id, body.model_dump(exclude_unset=True))
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return category


@router.put("/{category_id}/position", dependencies=[Depends(require_role("editor"))])
async def reposition_category(category_id: str, body: CategoryPosition):
    """Drag-and-drop endpoint: move this category to a specific index within
    a (possibly different) parent group. Resequences every affected sibling
    from scratch so `order` values always stay clean 0..n-1 regardless of
    where the item was dropped — no incremental swapping, no drift."""
    category = await category_repo.get(category_id)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    new_parent_id = body.parent_id
    if new_parent_id == category_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A category can't be its own parent")

    all_cats = await category_repo.list_for_property(category["property_id"])

    if new_parent_id:
        target_parent = next((c for c in all_cats if c["id"] == new_parent_id), None)
        if not target_parent:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Target category not found")
        if target_parent.get("parent_id"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only two levels of nesting are supported")
        if any(c.get("parent_id") == category_id for c in all_cats):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "A category with its own subcategories can't be nested under another category",
            )

    old_parent_id = category.get("parent_id")

    async def resequence(ids: list[str]):
        for i, cid in enumerate(ids):
            await category_repo.update(cid, {"order": i})

    if old_parent_id == new_parent_id:
        siblings = sorted(
            [c for c in all_cats if c.get("parent_id") == old_parent_id and c["id"] != category_id],
            key=lambda c: c["order"],
        )
        ids = [c["id"] for c in siblings]
        ids.insert(max(0, min(body.index, len(ids))), category_id)
        await resequence(ids)
    else:
        old_siblings = sorted(
            [c for c in all_cats if c.get("parent_id") == old_parent_id and c["id"] != category_id],
            key=lambda c: c["order"],
        )
        await resequence([c["id"] for c in old_siblings])

        new_siblings = sorted([c for c in all_cats if c.get("parent_id") == new_parent_id], key=lambda c: c["order"])
        ids = [c["id"] for c in new_siblings]
        ids.insert(max(0, min(body.index, len(ids))), category_id)
        # Written via a raw update so an explicit null (promoting to top-level)
        # actually persists — the generic repo update drops None values.
        await category_repo.collection.update_one(
            {"_id": category_repo.to_object_id(category_id)}, {"$set": {"parent_id": new_parent_id}}
        )
        await resequence(ids)

    return await category_repo.get(category_id)


@router.delete("/{category_id}", dependencies=[Depends(require_role("editor"))])
async def delete_category(category_id: str):
    # Subcategories of this category are orphaned (not cascade-deleted) so
    # they can be re-parented later; articles already tagged with this
    # category just keep their embedded {name, slug} copy untouched.
    await category_repo.collection.update_many({"parent_id": category_id}, {"$set": {"parent_id": None}})
    deleted = await category_repo.delete(category_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return {"ok": True}
