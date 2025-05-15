import sys
import os
import pytest
from unittest.mock import patch, MagicMock


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../app")))

from utils import chunk_text, generate_embedding, PgVectorSearchTool

# ✅ Test: chunk_text properly splits text
def test_chunk_text_splits_text():
    sample = "Hello world. " * 1000
    chunks = chunk_text(sample, max_tokens=100)
    assert isinstance(chunks, list)
    assert all(isinstance(chunk, str) for chunk in chunks)
    assert len(chunks) > 1

# ✅ Test: generate_embedding returns mock 1536-length vector
@patch("utils.get_openai_client")
def test_generate_embedding_mocks_openai(mock_client):
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
    mock_client.return_value.embeddings.create.return_value = mock_response

    result = generate_embedding("Test content")
    assert isinstance(result, list)
    assert len(result) == 1536
    assert all(isinstance(x, float) for x in result)

# ✅ Test: PgVectorSearchTool._run returns mocked DB result
@patch("utils.SessionLocal")
@patch("utils.generate_embedding", return_value=[0.1] * 1536)
def test_pgvector_search_tool_run(mock_embed, mock_db):
    mock_row = MagicMock()
    mock_row.source_text = "Relevant result from DB"
    mock_db.return_value.query().order_by().limit().all.return_value = [mock_row]

    tool = PgVectorSearchTool()
    result = tool._run("ai contract")
    assert "Relevant result from DB" in result
