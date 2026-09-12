from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class VersionRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["versions"])

    async def list_for_entity(self, entity_type: str, entity_id: str):
        cursor = self.collection.find({"entity_type": entity_type, "entity_id": entity_id}).sort("version", -1)
        from app.models.common import doc_out

        return [doc_out(d) async for d in cursor]

    async def get_version(self, entity_type: str, entity_id: str, version: int):
        from app.models.common import doc_out

        doc = await self.collection.find_one(
            {"entity_type": entity_type, "entity_id": entity_id, "version": version}
        )
        return doc_out(doc)

    async def next_version_number(self, entity_type: str, entity_id: str) -> int:
        latest = await self.collection.find_one(
            {"entity_type": entity_type, "entity_id": entity_id}, sort=[("version", -1)]
        )
        return (latest["version"] + 1) if latest else 1

    async def create_snapshot(self, entity_type: str, entity_id: str, snapshot: dict, created_by: str | None):
        from datetime import datetime

        version = await self.next_version_number(entity_type, entity_id)
        doc = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "version": version,
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "snapshot": snapshot,
        }
        result = await self.collection.insert_one(doc)
        return await self.get(str(result.inserted_id))


version_repo = VersionRepository()
