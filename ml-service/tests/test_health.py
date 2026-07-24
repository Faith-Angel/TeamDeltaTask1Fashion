"""Tests for GET /health endpoint."""

from unittest.mock import patch


def test_health_ok(client):
    """Returns 200 with status='ok' when both deps are healthy."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["clip_loaded"] is True
    assert data["pinecone_connected"] is True
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_health_degraded_clip_not_loaded(client):
    """Returns status='degraded' when CLIP is not loaded."""
    with patch("app.services.clip_service.clip_loaded", False):
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["clip_loaded"] is False
    assert data["status"] == "degraded"


def test_health_degraded_pinecone_not_connected(client):
    """Returns status='degraded' when Pinecone is not connected."""
    with patch("app.services.pinecone_service.pinecone_connected", False):
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["pinecone_connected"] is False
    assert data["status"] == "degraded"


def test_health_no_api_key_required(client):
    """Health endpoint must be accessible without any authentication."""
    # Note: no X-API-Key header
    response = client.get("/health")
    assert response.status_code == 200
