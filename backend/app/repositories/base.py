from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorCollection

from app.core.database import get_db
from app.models.common import doc_out


class BaseRepository:
    collection_name: str

    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def collection(self) -> AsyncIOMotorCollection:
        return get_db()[self.collection_name]

    @staticmethod
    def to_object_id(id_str: str) -> ObjectId:
        try:
            return ObjectId(id_str)
        except (InvalidId, TypeError):
            raise ValueError(f"Invalid id: {id_str}")

    async def list(self, filter_: Optional[dict] = None, limit: int = 500, skip: int = 0) -> list[dict]:
        cursor = self.collection.find(filter_ or {}).skip(skip).limit(limit).sort("_id", -1)
        return [doc_out(d) async for d in cursor]

    async def get(self, id_str: str) -> Optional[dict]:
        doc = await self.collection.find_one({"_id": self.to_object_id(id_str)})
        return doc_out(doc)

    async def get_by(self, filter_: dict) -> Optional[dict]:
        doc = await self.collection.find_one(filter_)
        return doc_out(doc)

    async def create(self, data: dict) -> dict:
        now = datetime.utcnow()
        data = {**data, "created_at": now, "updated_at": now}
        result = await self.collection.insert_one(data)
        return await self.get(str(result.inserted_id))

    async def update(self, id_str: str, data: dict) -> Optional[dict]:
        data = {k: v for k, v in data.items() if v is not None}
        data["updated_at"] = datetime.utcnow()
        await self.collection.update_one({"_id": self.to_object_id(id_str)}, {"$set": data})
        return await self.get(id_str)

    async def delete(self, id_str: str) -> bool:
        result = await self.collection.delete_one({"_id": self.to_object_id(id_str)})
        return result.deleted_count > 0

    async def count(self, filter_: Optional[dict] = None) -> int:
        return await self.collection.count_documents(filter_ or {})
