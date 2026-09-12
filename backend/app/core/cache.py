import json
from typing import Any, Optional

import redis.asyncio as redis

from app.core.config import settings

_client: Optional[redis.Redis] = None
PWA_CACHE_TTL_SECONDS = 15


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def cache_get(key: str) -> Optional[Any]:
    try:
        raw = await get_redis().get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int = PWA_CACHE_TTL_SECONDS) -> None:
    try:
        await get_redis().set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


async def cache_clear_prefix(prefix: str) -> None:
    try:
        client = get_redis()
        async for key in client.scan_iter(f"{prefix}*"):
            await client.delete(key)
    except Exception:
        pass
