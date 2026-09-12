from app.core.database import COLLECTIONS
from app.repositories.base import BaseRepository


class PwaTargetRepository(BaseRepository):
    def __init__(self):
        super().__init__(COLLECTIONS["pwa_targets"])


pwa_target_repo = PwaTargetRepository()
