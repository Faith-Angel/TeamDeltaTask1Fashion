"""
GET /health — public endpoint, no API key required.

Returns the overall service status and per-dependency readiness:
  - clip_loaded:        True if CLIP model is in memory
  - pinecone_connected: True if Pinecone index is reachable

Status is "ok" only when both dependencies are healthy; otherwise "degraded".
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.responses import HealthResponse
from app.services import clip_service, pinecone_service

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    description=(
        "Returns CLIP model load status and Pinecone connection status. "
        "No authentication required."
    ),
)
async def health_check() -> HealthResponse:
    both_ok = clip_service.clip_loaded and pinecone_service.pinecone_connected
    return HealthResponse(
        status="ok" if both_ok else "degraded",
        clip_loaded=clip_service.clip_loaded,
        pinecone_connected=pinecone_service.pinecone_connected,
        timestamp=datetime.now(timezone.utc),
    )
