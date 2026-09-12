from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class NavigationRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["navigations"])

    async def get_by_property_and_type(self, property_id: str, type_: str):
        return await self.get_by({"property_id": property_id, "type": type_})

    async def list_for_property(self, property_id: str):
        return await self.list({"property_id": property_id})


navigation_repo = NavigationRepository()
