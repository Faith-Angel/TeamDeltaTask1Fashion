"""
NdoloStitch ML Service — FastAPI entry point.

Startup lifecycle:
  1. Load CLIP ViT-B/32 model into memory.
  2. Connect to Pinecone index.
  3. Initialize Gemini client.
  4. Register routes.

All /api/v1/* endpoints require X-API-Key header.
GET /health is public.
GET /metrics is public (Prometheus).
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1.router import api_router
from app.core.config import settings
from app.services import clip_service, pinecone_service
from app.gemini_client import get_style_advice, extract_brief, ACTIVE_MODEL, SDK_VERSION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models, connect to external services, and initialize Gemini at startup."""
    
    # ── CLIP ──────────────────────────────────────────────────────────────
    logger.info("Loading CLIP model: %s", settings.CLIP_MODEL_NAME)
    clip_service.load_model()
    if clip_service.clip_loaded:
        logger.info("CLIP model loaded successfully.")
    else:
        logger.error("CLIP model failed to load — embedding endpoints will return 503.")

    # ── Pinecone ──────────────────────────────────────────────────────────
    logger.info("Connecting to Pinecone index: %s", settings.PINECONE_INDEX_NAME)
    pinecone_service.connect()
    if pinecone_service.pinecone_connected:
        logger.info("Pinecone connected successfully.")
    else:
        logger.error("Pinecone failed to connect — search endpoints will return 503.")

    # ── Gemini ────────────────────────────────────────────────────────────
    logger.info("Initializing Gemini client...")
    logger.info("  Active model: %s", ACTIVE_MODEL)
    logger.info("  SDK version: %s", SDK_VERSION)
    
    # Test Gemini connection
    try:
        test_response = get_style_advice("Test connection")
        if test_response.startswith("Error:"):
            logger.warning("Gemini initialized but returned error: %s", test_response[:100])
        else:
            logger.info("Gemini client initialized successfully.")
    except Exception as e:
        logger.error("Gemini initialization failed: %s", str(e))
        # Non-fatal - Gemini endpoints will return errors gracefully

    yield  # ← application runs

    # Cleanup (if needed)
    logger.info("ML Service shutting down.")


app = FastAPI(
    title="NdoloStitch ML Service",
    description=(
        "CLIP visual search + Gemini Flash style assistant "
        "for the NdoloStitch Cameroonian fashion platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────
# Allow the Next.js monolith to call this service.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Prometheus metrics ─────────────────────────────────────────────────────
Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=False,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics"],
).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

# ── Routes ─────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ── Health Endpoint Override (shows Gemini status too) ──────────────────
@app.get("/health")
async def health_check():
    """Public health check endpoint."""
    return {
        "status": "healthy",
        "components": {
            "clip": "loaded" if clip_service.clip_loaded else "failed",
            "pinecone": "connected" if pinecone_service.pinecone_connected else "failed",
            "gemini": {
                "model": ACTIVE_MODEL,
                "sdk": SDK_VERSION,
                "status": "available"
            }
        }
    }