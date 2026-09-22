from app.core.database import COLLECTIONS
from app.models.common import doc_out
from app.repositories.base import BaseRepository


class ContentItemRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["content_items"])

    async def list_for_property_and_type(self, property_id: str, content_type: str) -> list[dict]:
        cursor = self.collection.find({"property_id": property_id, "content_type": content_type}).sort("_id", -1)
        return [doc_out(d) async for d in cursor]

    async def rename_data_key(self, property_id: str, content_type: str, old_key: str, new_key: str) -> int:
        """Moves every item's value at data.<old_key> to data.<new_key> — used
        when a Content Model field's key is renamed, so already-saved items
        keep their data instead of it going orphaned under the old key."""
        result = await self.collection.update_many(
            {"property_id": property_id, "content_type": content_type, f"data.{old_key}": {"$exists": True}},
            {"$rename": {f"data.{old_key}": f"data.{new_key}"}},
        )
        return result.modified_count


content_item_repo = ContentItemRepository()
