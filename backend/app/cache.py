import redis
import os
import json

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

CACHE_TTL = 3600  # Time to live: 1 hour

def get_cached_result(query: str):
    key = f"query:{query}"
    return redis_client.get(key)

def set_cached_result(query: str, result: list):
    key = f"query:{query}"
    redis_client.setex(key, CACHE_TTL, json.dumps(result))
