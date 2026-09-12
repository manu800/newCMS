from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongo_db_name]


COLLECTIONS = {
    "users": "users",
    "properties": "properties",
    "themes": "themes",
    "components": "components",
    "pages": "pages",
    "navigations": "navigations",
    "articles": "common_articles",
    "versions": "versions",
    "pwa_targets": "pwa_targets",
}
