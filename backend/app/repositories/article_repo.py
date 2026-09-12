from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class ArticleRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["articles"])

    async def get_by_slug(self, slug: str):
        return await self.get_by({"script_slug": slug})

    async def resolve_data_source(self, data_source: dict) -> list[dict]:
        """Resolve a page section's data_source config into CommonArticle documents."""
        ds_type = (data_source or {}).get("type", "manual")
        limit = int((data_source or {}).get("limit") or 10)
        base_filter = {"show_on_web": True, "script_status": True}

        if ds_type == "latest":
            cursor = self.collection.find(base_filter).sort("publication_date", -1).limit(limit)
        elif ds_type == "trending":
            cursor = (
                self.collection.find({**base_filter, "is_trending": True})
                .sort("trending_order", 1)
                .limit(limit)
            )
        elif ds_type == "breaking":
            cursor = self.collection.find({**base_filter, "is_breaking": "true"}).sort(
                "publication_date", -1
            ).limit(limit)
        elif ds_type == "category":
            cat = data_source.get("category_slug") or data_source.get("category_id")
            cursor = self.collection.find(
                {**base_filter, "parent_category.slug": cat}
            ).sort("publication_date", -1).limit(limit)
        elif ds_type == "tag":
            tag = data_source.get("tag")
            cursor = self.collection.find(
                {**base_filter, "tags.slug": tag}
            ).sort("publication_date", -1).limit(limit)
        elif ds_type == "video":
            cursor = self.collection.find(
                {**base_filter, "article_type": "video"}
            ).sort("publication_date", -1).limit(limit)
        elif ds_type == "search":
            query = data_source.get("query") or ""
            cursor = self.collection.find(
                {**base_filter, "script_headline": {"$regex": query, "$options": "i"}}
            ).limit(limit)
        elif ds_type == "manual":
            ids = data_source.get("article_ids") or []
            object_ids = [self.to_object_id(i) for i in ids]
            cursor = self.collection.find({"_id": {"$in": object_ids}})
        else:
            cursor = self.collection.find(base_filter).limit(limit)

        from app.models.common import doc_out

        return [doc_out(d) async for d in cursor]


article_repo = ArticleRepository()
