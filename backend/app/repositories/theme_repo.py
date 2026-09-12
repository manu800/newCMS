from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class ThemeRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["themes"])

    async def get_by_slug(self, slug: str):
        return await self.get_by({"slug": slug})


theme_repo = ThemeRepository()
