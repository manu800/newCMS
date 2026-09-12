from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class PropertyRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["properties"])

    async def get_by_slug(self, slug: str):
        return await self.get_by({"slug": slug})


property_repo = PropertyRepository()
