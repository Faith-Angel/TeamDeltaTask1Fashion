"""
Shared pytest fixtures for the NdoloStitch ML Service test suite.

All external dependencies (CLIP model, Pinecone, Gemini API) are mocked
so tests run without any credentials or GPU.
"""

import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# ── Set required env vars BEFORE importing app modules ───────────────────
os.environ.setdefault("ML_SERVICE_API_KEY", "test-api-key-12345")
os.environ.setdefault("GOOGLE_API_KEY", "test-google-key")
os.environ.setdefault("PINECONE_API_KEY", "test-pinecone-key")
os.environ.setdefault("PINECONE_INDEX_NAME", "test-index")
os.environ.setdefault("CLIP_MODEL_NAME", "openai/clip-vit-base-patch32")
os.environ.setdefault("MODEL_CACHE_DIR", "/tmp/test-model-cache")


VALID_API_KEY = "test-api-key-12345"
AUTH_HEADERS = {"X-API-Key": VALID_API_KEY}

# A deterministic fake 512-dim embedding for use across tests
FAKE_EMBEDDING: list[float] = [0.01] * 512


@pytest.fixture(scope="session")
def mock_clip_loaded():
    """Patch clip_service so it reports as loaded without running inference."""
    with (
        patch("app.services.clip_service.clip_loaded", True),
        patch(
            "app.services.clip_service.embed_image_bytes",
            return_value=(FAKE_EMBEDDING, False),
        ),
        patch(
            "app.services.clip_service.load_image_from_url",
            return_value=b"fakeimagebytes",
        ),
    ):
        yield


@pytest.fixture(scope="session")
def mock_pinecone_connected():
    """Patch pinecone_service so it reports as connected and returns fake results."""
    fake_results = [
        {
            "id": f"img_test_{i:03d}",
            "score": round(0.95 - i * 0.02, 4),
            "image_url": f"https://example.com/image_{i}.jpg",
            "category": "Traditional Wedding",
            "traditional": True,
            "region": "Northwest",
            "occasion": "Wedding",
            "price_range": "100000-300000",
        }
        for i in range(12)
    ]
    with (
        patch("app.services.pinecone_service.pinecone_connected", True),
        patch(
            "app.services.pinecone_service.query_vectors",
            return_value=fake_results,
        ),
    ):
        yield


@pytest.fixture(scope="session")
def mock_gemini():
    """Patch gemini_service so tests don't call the real API."""
    fake_brief = {
        "style": "Traditional Bamileke",
        "occasion": "Wedding",
        "color_palette": ["Royal Blue", "Gold"],
        "fabric_preference": "Toghu wool",
        "budget_range_xaf": "100000-300000",
        "special_requirements": "Include a headwrap",
    }

    async def fake_chat(message, history):
        return "For a traditional Bamileke wedding, I recommend Toghu fabric in royal blue and gold."

    async def fake_extract_brief(history):
        return fake_brief

    with (
        patch("app.services.gemini_service.chat", side_effect=fake_chat),
        patch("app.services.gemini_service.extract_brief", side_effect=fake_extract_brief),
    ):
        yield


@pytest.fixture(scope="session")
def client(mock_clip_loaded, mock_pinecone_connected, mock_gemini):
    """FastAPI TestClient with all external deps mocked."""
    from app.main import app

    with TestClient(app) as c:
        yield c
