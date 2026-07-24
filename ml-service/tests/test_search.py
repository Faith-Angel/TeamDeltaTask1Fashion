"""Tests for POST /api/v1/similar-search endpoints."""

from unittest.mock import patch

from tests.conftest import AUTH_HEADERS


_REQUIRED_RESULT_FIELDS = {
    "id", "score", "image_url", "category", "traditional", "region", "occasion", "price_range"
}


def test_similar_search_file_returns_results(client):
    """File upload returns a list of results with required metadata fields."""
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100

    response = client.post(
        "/api/v1/similar-search",
        headers=AUTH_HEADERS,
        files={"file": ("query.jpg", fake_jpeg, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "query_time_ms" in data
    assert isinstance(data["results"], list)
    assert len(data["results"]) > 0

    # Each result must contain all required fields
    for result in data["results"]:
        missing = _REQUIRED_RESULT_FIELDS - result.keys()
        assert not missing, f"Result missing fields: {missing}"
        assert 0.0 <= result["score"] <= 1.0
        assert isinstance(result["traditional"], bool)


def test_similar_search_url_returns_results(client):
    """Image URL search returns results."""
    response = client.post(
        "/api/v1/similar-search/url",
        headers=AUTH_HEADERS,
        json={"image_url": "https://example.com/dress.jpg", "top_k": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0


def test_similar_search_missing_api_key(client):
    """Returns 401 without X-API-Key."""
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    response = client.post(
        "/api/v1/similar-search",
        files={"file": ("query.jpg", fake_jpeg, "image/jpeg")},
    )
    assert response.status_code == 401


def test_similar_search_unsupported_mime(client):
    """Non-image MIME returns 422."""
    response = client.post(
        "/api/v1/similar-search",
        headers=AUTH_HEADERS,
        files={"file": ("data.csv", b"col1,col2", "text/csv")},
    )
    assert response.status_code == 422


def test_similar_search_503_when_pinecone_down(client):
    """Returns 503 when Pinecone is not connected."""
    with patch("app.services.pinecone_service.pinecone_connected", False):
        fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
        response = client.post(
            "/api/v1/similar-search",
            headers=AUTH_HEADERS,
            files={"file": ("query.jpg", fake_jpeg, "image/jpeg")},
        )
    assert response.status_code == 503


def test_similar_search_503_when_clip_down(client):
    """Returns 503 when CLIP is not loaded."""
    with patch("app.services.clip_service.clip_loaded", False):
        fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
        response = client.post(
            "/api/v1/similar-search",
            headers=AUTH_HEADERS,
            files={"file": ("query.jpg", fake_jpeg, "image/jpeg")},
        )
    assert response.status_code == 503


def test_similar_search_results_sorted_by_score(client):
    """Results are returned in descending score order."""
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    response = client.post(
        "/api/v1/similar-search",
        headers=AUTH_HEADERS,
        files={"file": ("query.jpg", fake_jpeg, "image/jpeg")},
    )
    assert response.status_code == 200
    scores = [r["score"] for r in response.json()["results"]]
    assert scores == sorted(scores, reverse=True), "Results must be sorted by score descending"
