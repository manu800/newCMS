from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["users"])

    async def get_by_email(self, email: str):
        return await self.get_by({"email": email})


user_repo = UserRepository()
