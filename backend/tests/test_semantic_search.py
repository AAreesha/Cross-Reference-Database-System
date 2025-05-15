import sys
import os
from unittest.mock import patch, MagicMock
import pytest

# ✅ Patch sys.path to locate `app` folder for module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../app")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@patch("routes.generate_embedding", return_value=[0.1] * 1536)
@patch("routes.ChatOpenAI")
@patch("routes.get_cached_result", return_value=None)
@patch("routes.set_cached_result", return_value=None)
@patch("routes.SessionLocal")
def test_semantic_search_valid(mock_db, mock_cache_set, mock_cache_get, mock_llm, mock_embed):
    dummy_record = MagicMock()
    dummy_record.id = 1
    dummy_record.source_tag = "db1"
    dummy_record.source_text = "Relevant contract for AI"

    mock_session = MagicMock()
    mock_session.query().filter().order_by().limit().all.return_value = [dummy_record]
    mock_db.return_value = mock_session

    mock_llm.return_value.return_value.content.strip.return_value = "## Result 1\n- **Field**: Value"

    response = client.post("/semantic-search/", params={"query": "AI contract"})
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["cached"] is False
    assert json_data["query"] == "AI contract"
    assert "gpt_response" in json_data
    assert "retrieved_context" in json_data
    assert "sources" in json_data


@patch("routes.redis_client.smembers", return_value={"cache1", "cache2"})
def test_get_cached_queries(mock_redis):
    response = client.get("/suggestions/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["suggestions"] == ["cache1", "cache2"]
