from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class ContentModelRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["content_models"])

    async def get_for_property_and_type(self, property_id: str, content_type: str) -> dict | None:
        return await self.get_by({"property_id": property_id, "content_type": content_type})


content_model_repo = ContentModelRepository()
