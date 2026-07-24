"""
POST /api/v1/similar-search

Accepts either:
  - multipart/form-data with a "file" field, OR
  - JSON body with { "image_url": "...", "top_k": 12, "filter": {} }

Pipeline:
  1. Fetch/read image bytes
  2. Generate CLIP embedding (with LRU cache)
  3. Query Pinecone for top-k cosine-nearest neighbours
  4. Return ranked results with metadata

Requires X-API-Key header.
"""

import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.circuit_breaker import clip_circuit, pinecone_circuit
from app.core.security import verify_api_key
from app.models.requests import SimilarSearchRequest
from app.models.responses import SearchResult, SimilarSearchResponse
from app.services import clip_service, pinecone_service

logger = logging.getLogger(__name__)

router = APIRouter()

_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


def _check_dependencies() -> None:
    if not clip_service.clip_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CLIP model is not loaded.",
        )
    if not pinecone_service.pinecone_connected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vector search unavailable — Pinecone is not connected.",
        )


@router.post(
    "/similar-search",
    response_model=SimilarSearchResponse,
    summary="Find visually similar Cameroonian fashion designs",
    dependencies=[Depends(verify_api_key)],
)
async def similar_search_file(
    file: UploadFile = File(..., description="Query image (JPEG/PNG/WEBP, max 10 MB)"),
    top_k: int = 12,
) -> SimilarSearchResponse:
    """Upload an image file to find similar designs across the Pinecone index."""
    _check_dependencies()
    clip_circuit.check()
    pinecone_circuit.check()

    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{file.content_type}'.",
        )

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File exceeds 10 MB limit.",
        )

    return await _run_search(image_bytes, top_k=top_k, filter=None)


@router.post(
    "/similar-search/url",
    response_model=SimilarSearchResponse,
    summary="Find visually similar designs using an image URL",
    dependencies=[Depends(verify_api_key)],
)
async def similar_search_url(body: SimilarSearchRequest) -> SimilarSearchResponse:
    """Provide a public image URL to find similar designs."""
    _check_dependencies()
    clip_circuit.check()
    pinecone_circuit.check()

    if body.image_url is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide image_url in the request body.",
        )

    try:
        image_bytes = await clip_service.load_image_from_url(str(body.image_url))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch image: {exc}",
        )

    return await _run_search(image_bytes, top_k=body.top_k, filter=body.filter)


async def _run_search(
    image_bytes: bytes,
    top_k: int,
    filter: dict | None,
) -> SimilarSearchResponse:
    """Shared search pipeline: embed → query → format results."""
    t_start = time.monotonic()

    try:
        embedding, _ = clip_circuit.call(clip_service.embed_image_bytes, image_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    try:
        raw_results = pinecone_circuit.call(
            pinecone_service.query_vectors, embedding, top_k, filter
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    elapsed_ms = int((time.monotonic() - t_start) * 1000)

    results = [SearchResult(**r) for r in raw_results]
    return SimilarSearchResponse(results=results, query_time_ms=elapsed_ms)
