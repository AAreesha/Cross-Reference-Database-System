import pytest
import sys
import os
from fastapi.testclient import TestClient

# 👇 Ensure import from `app` when you're inside `backend/tests/`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../app")))

from main import app
from routes import upload_status  # Make sure upload_status is not inside a function

client = TestClient(app)

def test_get_upload_status_valid():
    mock_upload_id = "test-id-123"
    upload_status[mock_upload_id] = {"status": "file upload pending", "inserted": 5}

    response = client.get(f"/files/status/{mock_upload_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "file upload pending"
    assert data["inserted"] == 5

def test_get_upload_status_invalid():
    response = client.get("/files/status/nonexistent-id-456")
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid upload_id"
