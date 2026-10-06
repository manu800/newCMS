from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


def _first(data: dict, *keys):
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return None


def _normalize_for_display(data: dict, *, default_orientation: str = "landscape") -> dict:
    """Best-effort mapping of a non-article Content Item's own field keys
    (e.g. Video's "body"/"category"/"large_image") onto the article-shaped
    fields the PWA's card components expect (script_headline/parent_category/
    script_thumbnail/...) — mirrors the CMS's toArticlePreviewData() so a
    custom content type can be pulled into a page section without its
    Content Model needing to reuse Article's exact field names.

    video_orientation falls back to `default_orientation` (the caller passes
    "portrait" for a content type like Reels) rather than always assuming
    landscape, since a vertical-video Content Model may have no orientation
    field of its own at all — every item is just always that shape."""
    return {
        **data,
        "script_headline": _first(data, "script_headline", "headline", "title", "name"),
        "script_summary": _first(data, "script_summary", "summary", "description"),
        "script_content": _first(data, "script_content", "body", "content"),
        "script_thumbnail": _first(
            data, "script_thumbnail", "thumbnail_url", "card_thumbnail", "large_image", "thumbnail", "image"
        ),
        "script_thumbnail_16_9": _first(data, "script_thumbnail_16_9", "large_image", "script_thumbnail"),
        "parent_category": _first(data, "parent_category", "category"),
        "tags": data.get("tags") or [],
        "author": data.get("author"),
        "video_orientation": data.get("video_orientation") or default_orientation,
    }


class ArticleRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["articles"])

    async def get_by_slug(self, slug: str):
        return await self.get_by({"script_slug": slug})

    async def resolve_data_source(self, data_source: dict) -> list[dict]:
        """Resolve a page section's data_source config into article-shaped
        documents — merging the legacy common_articles collection with any
        newer articles stored as a Content Item (content_type="article"),
        since a PWA homepage section shouldn't silently miss half of them."""
        from app.models.common import doc_out
        from app.repositories.content_item_repo import content_item_repo

        ds_type = (data_source or {}).get("type", "manual")
        limit = int((data_source or {}).get("limit") or 10)
        base_filter = {"show_on_web": True, "script_status": True}
        new_base_filter = {"content_type": "article", "data.show_on_web": True, "data.script_status": True}
        sort_field = "created_at"
        sort_dir = -1

        if ds_type == "latest":
            legacy_filter, new_filter = dict(base_filter), dict(new_base_filter)
        elif ds_type == "trending":
            legacy_filter = {**base_filter, "is_trending": True}
            new_filter = {**new_base_filter, "data.is_trending": True}
            sort_field, sort_dir = "trending_order", 1
        elif ds_type == "breaking":
            legacy_filter = {**base_filter, "is_breaking": "true"}
            new_filter = {**new_base_filter, "data.is_breaking": "true"}
        elif ds_type == "category":
            cats = data_source.get("category_slugs") or None
            if not cats:
                single = data_source.get("category_slug") or data_source.get("category_id")
                cats = [single] if single else []
            cat_filter = {"$in": cats} if len(cats) > 1 else (cats[0] if cats else None)
            legacy_filter = {**base_filter, "parent_category.slug": cat_filter}
            new_filter = {**new_base_filter, "data.parent_category.slug": cat_filter}
        elif ds_type == "tag":
            tag = data_source.get("tag")
            legacy_filter = {**base_filter, "tags.slug": tag}
            new_filter = {**new_base_filter, "data.tags.slug": tag}
        elif ds_type == "search":
            query = data_source.get("query") or ""
            legacy_filter = {**base_filter, "script_headline": {"$regex": query, "$options": "i"}}
            new_filter = {**new_base_filter, "data.script_headline": {"$regex": query, "$options": "i"}}
        elif ds_type == "authors":
            # Lists real people (Users flagged Is Author), not articles —
            # for an "our authors" / "meet the team" style section. Shaped
            # the same article-like way every other source is, so it drops
            # into any existing card component without a dedicated one.
            from app.repositories.user_repo import user_repo

            cursor = user_repo.collection.find({"is_author": True}).limit(limit)
            docs = []
            async for d in cursor:
                doc = doc_out(d)
                docs.append(
                    {
                        "id": doc["id"],
                        "script_headline": doc.get("name"),
                        "script_summary": doc.get("designation"),
                        "script_thumbnail": doc.get("avatar"),
                        "script_thumbnail_16_9": doc.get("avatar"),
                    }
                )
            return docs
        elif ds_type == "manual":
            ids = data_source.get("article_ids") or []
            object_ids = [self.to_object_id(i) for i in ids]
            legacy_docs = [doc_out(d) async for d in self.collection.find({"_id": {"$in": object_ids}})]
            found_ids = {d["id"] for d in legacy_docs}
            new_docs = []
            for item_id in ids:
                if item_id in found_ids:
                    continue
                item = await content_item_repo.get(item_id)
                if item and item.get("content_type") == "article":
                    new_docs.append({"id": item["id"], **item["data"]})
            return legacy_docs + new_docs
        elif data_source.get("field"):
            # A custom Source Type bound to a field (Content Models → Source
            # types → Add, with a Field name set) — matches data.<field>
            # against field_value across every content_type, since "group by
            # this field's value" (e.g. by author) cuts across content types
            # rather than picking one. The value could be a plain string, or
            # the .slug/.id of an object/array-of-objects field (category,
            # tag, author, ...), so all three are tried.
            field = data_source["field"]
            value = data_source.get("field_value")
            field_filter = {
                "$or": [
                    {f"data.{field}": value},
                    {f"data.{field}.slug": value},
                    {f"data.{field}.id": value},
                ]
            }
            cursor = content_item_repo.collection.find(field_filter).sort("created_at", -1).limit(limit)
            docs = []
            async for d in cursor:
                doc = doc_out(d)
                docs.append({"id": doc["id"], **_normalize_for_display(doc["data"])})
            return docs
        else:
            # Any other value is a custom Content Model's content_type (Video,
            # Reel, Quiz, or any future one) chosen as a page section's
            # source — pull straight from content_items rather than the
            # article base filters, since these items were never articles to
            # begin with. A "reel"-style type is vertical by definition, so
            # default its items to portrait unless one explicitly overrides it.
            default_orientation = "portrait" if ds_type in ("reel", "reels", "short", "shorts") else "landscape"
            cursor = content_item_repo.collection.find({"content_type": ds_type}).sort("created_at", -1).limit(limit)
            docs = []
            async for d in cursor:
                doc = doc_out(d)
                docs.append(
                    {"id": doc["id"], **_normalize_for_display(doc["data"], default_orientation=default_orientation)}
                )
            return docs

        legacy_cursor = self.collection.find(legacy_filter).sort(sort_field, sort_dir).limit(limit)
        legacy_docs = [doc_out(d) async for d in legacy_cursor]

        new_cursor = content_item_repo.collection.find(new_filter).sort(sort_field, sort_dir).limit(limit)
        new_docs = []
        async for d in new_cursor:
            doc = doc_out(d)
            new_docs.append({"id": doc["id"], **doc["data"]})

        combined = legacy_docs + new_docs
        combined.sort(key=lambda d: d.get(sort_field) or (0 if sort_dir == 1 else ""), reverse=sort_dir == -1)
        return combined[:limit]


article_repo = ArticleRepository()
