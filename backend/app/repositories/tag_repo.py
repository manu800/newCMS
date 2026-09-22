from app.core.database import COLLECTIONS
from app.models.common import doc_out
from app.repositories.base import BaseRepository


class TagRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["tags"])

    async def list_for_property(self, property_id: str) -> list[dict]:
        cursor = self.collection.find({"property_id": property_id}).sort("name", 1)
        return [doc_out(d) async for d in cursor]


tag_repo = TagRepository()
