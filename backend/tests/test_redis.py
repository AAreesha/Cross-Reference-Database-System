import sys
import os
import json
import pytest
from unittest.mock import patch, MagicMock

# Adjust path to import your app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../app")))

from cache import get_cached_result, set_cached_result, CACHE_TTL

@patch("cache.redis_client")
def test_set_cached_result(mock_redis):
    mock_setex = MagicMock()
    mock_sadd = MagicMock()
    mock_redis.setex = mock_setex
    mock_redis.sadd = mock_sadd

    query = "ai"
    data = {"foo": "bar"}

    set_cached_result(query, data)

    key = f"query:{query}"
    expected_data = json.dumps(data)

    mock_redis.setex.assert_called_once_with(key, CACHE_TTL, expected_data)
    mock_redis.sadd.assert_called_once_with("cached_queries", query)

@patch("cache.redis_client")
def test_get_cached_result(mock_redis):
    query = "ai"
    expected_value = '{"result": "mocked"}'
    mock_redis.get.return_value = expected_value

    result = get_cached_result(query)
    assert result == expected_value
    mock_redis.get.assert_called_once_with(f"query:{query}")
