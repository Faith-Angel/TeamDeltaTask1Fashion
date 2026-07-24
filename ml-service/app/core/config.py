"""
Application settings loaded from environment variables.
Uses Pydantic BaseSettings so every value is validated at startup.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── API Security ───────────────────────────────────────────────────
    ML_SERVICE_API_KEY: str = Field(..., description="Shared secret for X-API-Key header auth")

    # ── CLIP ───────────────────────────────────────────────────────────
    CLIP_MODEL_NAME: str = Field(
        "openai/clip-vit-base-patch32",
        description="HuggingFace model ID for CLIP",
    )
    # Local cache dir for the downloaded model (mounted as Docker volume)
    MODEL_CACHE_DIR: str = Field("/model-cache", description="Path to HuggingFace model cache")

    # ── Pinecone ───────────────────────────────────────────────────────
    PINECONE_API_KEY: str = Field(..., description="Pinecone API key")
    PINECONE_INDEX_NAME: str = Field("ndolostitch-fashion", description="Pinecone index name")
    PINECONE_DIMENSION: int = Field(512, description="Embedding dimension (CLIP ViT-B/32 = 512)")
    PINECONE_METRIC: str = Field("cosine", description="Distance metric for ANN search")

    # ── Gemini ─────────────────────────────────────────────────────────
    GOOGLE_API_KEY: str = Field(..., description="Google AI Studio API key")
    GEMINI_MODEL: str = Field("gemini-2.0-flash", description="Gemini model identifier")

    # ── Caching ────────────────────────────────────────────────────────
    CACHE_TTL_SECONDS: int = Field(3600, description="LRU cache TTL for embeddings (seconds)")
    CACHE_MAX_SIZE: int = Field(512, description="Max number of cached embeddings")

    # ── Circuit Breaker ────────────────────────────────────────────────
    CIRCUIT_BREAKER_THRESHOLD: int = Field(5, description="Failures before circuit opens")
    CIRCUIT_BREAKER_TIMEOUT: int = Field(60, description="Seconds to stay OPEN before probing")

    # ── CORS ───────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "https://ndolostitch.vercel.app"],
        description="Origins allowed to call this service (the Next.js monolith URL)",
    )


# Single shared instance — import this everywhere
settings = Settings()
