from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class ComponentRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["components"])

    async def get_by_type(self, type_: str):
        return await self.get_by({"type": type_})


component_repo = ComponentRepository()
