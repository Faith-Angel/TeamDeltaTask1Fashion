"""Tests for POST /api/v1/style-chat endpoint."""

import pytest
from unittest.mock import AsyncMock, patch

from tests.conftest import AUTH_HEADERS


_VALID_BODY = {
    "message": "I need an elegant outfit for a traditional Bamileke wedding",
    "conversation_id": "conv_test_001",
    "history": [],
    "extract_brief": False,
}


def test_style_chat_returns_reply(client):
    """Valid request returns a non-empty reply."""
    response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=_VALID_BODY)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert data["conversation_id"] == "conv_test_001"
    assert data["brief"] is None  # extract_brief=False


def test_style_chat_extract_brief_flag(client):
    """Setting extract_brief=True returns a non-null structured brief."""
    body = {**_VALID_BODY, "extract_brief": True}
    response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=body)
    assert response.status_code == 200
    data = response.json()
    assert data["brief"] is not None
    brief = data["brief"]
    assert "style" in brief
    assert "occasion" in brief
    assert isinstance(brief["color_palette"], list)
    assert "fabric_preference" in brief
    assert "budget_range_xaf" in brief
    assert "special_requirements" in brief


def test_style_chat_trigger_phrase_extracts_brief(client):
    """Message containing 'generate brief' triggers brief extraction."""
    body = {
        **_VALID_BODY,
        "message": "generate brief based on what we discussed",
        "extract_brief": False,
    }
    response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=body)
    assert response.status_code == 200
    # Brief should be populated because trigger phrase was detected
    assert response.json()["brief"] is not None


def test_style_chat_with_conversation_history(client):
    """Passes history correctly and returns a reply."""
    body = {
        "message": "Can you be more specific about the fabric?",
        "conversation_id": "conv_test_002",
        "history": [
            {"role": "user", "content": "I want a traditional wedding dress"},
            {"role": "assistant", "content": "I recommend Toghu fabric for a Bamileke ceremony."},
        ],
        "extract_brief": False,
    }
    response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=body)
    assert response.status_code == 200
    assert len(response.json()["reply"]) > 0


def test_style_chat_missing_api_key(client):
    """Returns 401 without X-API-Key."""
    response = client.post("/api/v1/style-chat", json=_VALID_BODY)
    assert response.status_code == 401


def test_style_chat_message_too_long(client):
    """Message exceeding 2000 chars returns 422."""
    body = {**_VALID_BODY, "message": "x" * 2001}
    response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=body)
    assert response.status_code == 422


def test_style_chat_empty_message(client):
    """Empty message returns 422."""
    body = {**_VALID_BODY, "message": ""}
    response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=body)
    assert response.status_code == 422


def test_style_chat_gemini_timeout_returns_504(client):
    """If Gemini times out, endpoint returns 504."""
    async def timeout_chat(message, history):
        raise TimeoutError("Gemini timeout")

    with patch("app.services.gemini_service.chat", side_effect=timeout_chat):
        response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=_VALID_BODY)
    assert response.status_code == 504
    assert "too long" in response.json()["detail"].lower()


def test_style_chat_gemini_error_returns_502(client):
    """If Gemini raises an unexpected error, endpoint returns 502."""
    async def broken_chat(message, history):
        raise RuntimeError("Unexpected Gemini error")

    with patch("app.services.gemini_service.chat", side_effect=broken_chat):
        response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=_VALID_BODY)
    assert response.status_code == 502


def test_style_chat_brief_extraction_failure_is_non_fatal(client):
    """If brief extraction fails, reply is still returned (brief=null)."""
    async def broken_brief(history):
        raise RuntimeError("JSON parse error")

    body = {**_VALID_BODY, "extract_brief": True}
    with patch("app.services.gemini_service.extract_brief", side_effect=broken_brief):
        response = client.post("/api/v1/style-chat", headers=AUTH_HEADERS, json=body)
    assert response.status_code == 200
    data = response.json()
    assert len(data["reply"]) > 0
    assert data["brief"] is None  # graceful degradation
