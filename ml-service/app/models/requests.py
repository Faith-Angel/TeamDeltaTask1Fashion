"""Pydantic request models for NdoloStitch ML Service."""

from typing import Any
from pydantic import BaseModel, Field, HttpUrl


class ImageUrlRequest(BaseModel):
    """Request body for image-URL-based endpoints."""
    image_url: HttpUrl = Field(..., description="Publicly accessible image URL (JPEG/PNG/WEBP)")


class SimilarSearchRequest(BaseModel):
    """Request body for the similar-search endpoint."""
    image_url: HttpUrl | None = Field(None, description="Public image URL (use this OR upload file)")
    top_k: int = Field(12, ge=1, le=50, description="Number of results to return")
    filter: dict[str, Any] | None = Field(None, description="Optional Pinecone metadata filter")


class ChatMessage(BaseModel):
    """A single message in a conversation history."""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=8000)


class StyleChatRequest(BaseModel):
    """Request body for the style-chat endpoint."""
    message: str = Field(..., min_length=1, max_length=2000, description="User's new message")
    conversation_id: str = Field(..., min_length=1, description="Client-generated session ID")
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=40,  # 20 turns × 2 roles
        description="Prior conversation turns (user + assistant alternating)",
    )
    extract_brief: bool = Field(False, description="Force structured brief extraction")
