import pytest
import io
import sys
import os
from unittest.mock import patch
from fastapi.testclient import TestClient

# Fix import path if you're running from /backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../app")))

from main import app

client = TestClient(app)

@patch("app.routes.generate_embedding", return_value=[0.1] * 1536)
@patch("app.routes.process_upload_file", return_value=None)
def test_ingest_file(mock_process, mock_embed):
    dummy_csv = "name,email\nAlice,alice@example.com\nBob,bob@example.com"
    files = {
        "file": ("dummy.csv", io.BytesIO(dummy_csv.encode("utf-8")), "text/csv")
    }
    data = {"source_tag": "db1"}

    response = client.post("/files/ingest", files=files, data=data)
    assert response.status_code == 200
    json_data = response.json()
    assert "upload_id" in json_data
    assert json_data["status"] == "file upload pending"

    # Check status endpoint
    upload_id = json_data["upload_id"]
    status_resp = client.get(f"/files/status/{upload_id}")
    assert status_resp.status_code == 200
    assert "status" in status_resp.json()

def test_invalid_file_type():
    dummy_txt = "Just some text content"
    files = {
        "file": ("file.txt", io.BytesIO(dummy_txt.encode("utf-8")), "text/plain")
    }
    data = {"source_tag": "db1"}

    response = client.post("/files/ingest", files=files, data=data)
    assert response.status_code == 400
    assert "Only CSV or Excel" in response.text

def test_invalid_source_tag():
    dummy_csv = "name,email\nCharlie,charlie@example.com"
    files = {
        "file": ("dummy.csv", io.BytesIO(dummy_csv.encode("utf-8")), "text/csv")
    }
    data = {"source_tag": "invalid_db"}

    response = client.post("/files/ingest", files=files, data=data)
    assert response.status_code == 400
    assert "Invalid source_tag" in response.text
