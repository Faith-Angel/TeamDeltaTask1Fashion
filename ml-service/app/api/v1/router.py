"""Aggregates all v1 endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, embeddings, search, style_chat

api_router = APIRouter()

# Health check (no auth required — mounted separately in main.py at root level)
api_router.include_router(health.router, tags=["Health"])

# ML endpoints (all require X-API-Key)
api_router.include_router(embeddings.router, prefix="/api/v1", tags=["Embeddings"])
api_router.include_router(search.router, prefix="/api/v1", tags=["Search"])
api_router.include_router(style_chat.router, prefix="/api/v1", tags=["Style Assistant"])

# (Optional) Add a root redirect or info endpoint
@api_router.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "NdoloStitch ML Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "metrics": "/metrics",
            "api": {
                "embeddings": "/api/v1/generate-embedding",
                "search": "/api/v1/similar-search",
                "style_chat": "/api/v1/style-chat",
            }
        }
    }