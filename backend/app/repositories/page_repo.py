from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class PageRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["pages"])

    async def get_by_property_and_slug(self, property_id: str, slug: str):
        return await self.get_by({"property_id": property_id, "slug": slug})

    async def list_for_property(self, property_id: str):
        return await self.list({"property_id": property_id})


page_repo = PageRepository()
