"""Tests for POST /api/v1/generate-embedding endpoints."""

import io
from unittest.mock import patch

from tests.conftest import AUTH_HEADERS, FAKE_EMBEDDING


# ── File upload endpoint ───────────────────────────────────────────────────

def test_generate_embedding_valid_jpeg(client):
    """Valid JPEG upload returns a 512-dim embedding."""
    # Minimal valid JPEG header bytes
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100

    response = client.post(
        "/api/v1/generate-embedding",
        headers=AUTH_HEADERS,
        files={"file": ("photo.jpg", fake_jpeg, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert len(data["embedding"]) == 512
    assert data["model"] == "clip-vit-b-32"
    assert isinstance(data["cached"], bool)


def test_generate_embedding_valid_png(client):
    """Valid PNG upload returns a 512-dim embedding."""
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

    response = client.post(
        "/api/v1/generate-embedding",
        headers=AUTH_HEADERS,
        files={"file": ("photo.png", fake_png, "image/png")},
    )
    assert response.status_code == 200
    assert len(response.json()["embedding"]) == 512


def test_generate_embedding_unsupported_mime(client):
    """Unsupported MIME type returns 422."""
    response = client.post(
        "/api/v1/generate-embedding",
        headers=AUTH_HEADERS,
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 422
    assert "Unsupported file type" in response.json()["detail"]


def test_generate_embedding_file_too_large(client):
    """File exceeding 10 MB returns 422."""
    big_file = b"\xff\xd8\xff\xe0" + b"\x00" * (10 * 1024 * 1024 + 1)

    response = client.post(
        "/api/v1/generate-embedding",
        headers=AUTH_HEADERS,
        files={"file": ("big.jpg", big_file, "image/jpeg")},
    )
    assert response.status_code == 422
    assert "too large" in response.json()["detail"].lower()


def test_generate_embedding_missing_api_key(client):
    """Missing X-API-Key returns 401."""
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    response = client.post(
        "/api/v1/generate-embedding",
        files={"file": ("photo.jpg", fake_jpeg, "image/jpeg")},
    )
    assert response.status_code == 401


def test_generate_embedding_invalid_api_key(client):
    """Wrong X-API-Key returns 401."""
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    response = client.post(
        "/api/v1/generate-embedding",
        headers={"X-API-Key": "wrong-key"},
        files={"file": ("photo.jpg", fake_jpeg, "image/jpeg")},
    )
    assert response.status_code == 401


def test_generate_embedding_503_when_clip_not_loaded(client):
    """Returns 503 when CLIP model failed to load."""
    with patch("app.services.clip_service.clip_loaded", False):
        fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
        response = client.post(
            "/api/v1/generate-embedding",
            headers=AUTH_HEADERS,
            files={"file": ("photo.jpg", fake_jpeg, "image/jpeg")},
        )
    assert response.status_code == 503


# ── URL endpoint ──────────────────────────────────────────────────────────

def test_generate_embedding_from_url(client):
    """Valid image URL returns a 512-dim embedding."""
    response = client.post(
        "/api/v1/generate-embedding/url",
        headers=AUTH_HEADERS,
        json={"image_url": "https://example.com/photo.jpg"},
    )
    assert response.status_code == 200
    assert len(response.json()["embedding"]) == 512
