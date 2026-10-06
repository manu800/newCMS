from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class SettingsRepository(BaseRepository):
    """A tiny global key/value store for CMS-wide settings that don't fit
    any other collection — currently just the sidebar's Content section
    order. One document per key, keyed by a fixed `_id` string."""

    def __init__(self):
        super().__init__(COLLECTIONS["settings"])

    async def get_value(self, key: str, default):
        doc = await self.collection.find_one({"_id": key})
        return doc["value"] if doc else default

    async def set_value(self, key: str, value) -> None:
        await self.collection.update_one({"_id": key}, {"$set": {"value": value}}, upsert=True)


settings_repo = SettingsRepository()
