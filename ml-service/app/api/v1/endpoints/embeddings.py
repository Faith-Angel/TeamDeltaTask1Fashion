"""
POST /api/v1/generate-embedding

Accepts either:
  - A multipart/form-data file upload (field name: "file"), OR
  - A JSON body with { "image_url": "https://..." }

Returns a 512-dimensional CLIP embedding vector.
Requires X-API-Key header.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.circuit_breaker import clip_circuit
from app.core.security import verify_api_key
from app.models.requests import ImageUrlRequest
from app.models.responses import EmbeddingResponse
from app.services import clip_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed MIME types for uploaded images
_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


def _validate_clip_available() -> None:
    if not clip_service.clip_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CLIP model is not loaded. Try again shortly.",
        )


@router.post(
    "/generate-embedding",
    response_model=EmbeddingResponse,
    summary="Generate a 512-dim CLIP embedding from an image",
    dependencies=[Depends(verify_api_key)],
)
async def generate_embedding_from_file(
    file: UploadFile = File(..., description="Image file (JPEG/PNG/WEBP, max 10 MB)"),
) -> EmbeddingResponse:
    """Upload an image file to get its CLIP embedding."""
    _validate_clip_available()
    clip_circuit.check()  # raises 503 if circuit is OPEN

    # Validate MIME type
    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{file.content_type}'. Use JPEG, PNG, or WEBP.",
        )

    image_bytes = await file.read()

    # Validate size
    if len(image_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large ({len(image_bytes) // 1024} KB). Maximum is 10 MB.",
        )

    try:
        embedding, cached = clip_circuit.call(clip_service.embed_image_bytes, image_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    return EmbeddingResponse(embedding=embedding, cached=cached)


@router.post(
    "/generate-embedding/url",
    response_model=EmbeddingResponse,
    summary="Generate a 512-dim CLIP embedding from an image URL",
    dependencies=[Depends(verify_api_key)],
)
async def generate_embedding_from_url(body: ImageUrlRequest) -> EmbeddingResponse:
    """Provide a public image URL to get its CLIP embedding."""
    _validate_clip_available()
    clip_circuit.check()

    try:
        image_bytes = await clip_service.load_image_from_url(str(body.image_url))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch image from URL: {exc}",
        )

    try:
        embedding, cached = clip_circuit.call(clip_service.embed_image_bytes, image_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    return EmbeddingResponse(embedding=embedding, cached=cached)
