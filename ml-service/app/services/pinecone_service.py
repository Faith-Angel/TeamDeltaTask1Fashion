"""
Pinecone vector database service.

Responsibilities:
  - Connect to Pinecone at startup via connect().
  - Create the index if it does not yet exist.
  - Upsert vectors with metadata (used by the seed script).
  - Query the index for top-k nearest neighbours.

Public state flag read by the /health endpoint:
  pinecone_connected: bool
"""

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Module-level state ────────────────────────────────────────────────────
pinecone_connected: bool = False
_index = None  # pinecone.Index instance


def connect() -> None:
    """
    Initialize the Pinecone client and obtain a handle to the index.
    Creates the index if it does not exist.
    Called once during app lifespan startup.
    """
    global pinecone_connected, _index

    try:
        from pinecone import Pinecone, ServerlessSpec  # type: ignore

        pc = Pinecone(api_key=settings.PINECONE_API_KEY)

        existing = [idx.name for idx in pc.list_indexes()]
        if settings.PINECONE_INDEX_NAME not in existing:
            logger.info(
                "Pinecone index '%s' not found — creating it.",
                settings.PINECONE_INDEX_NAME,
            )
            pc.create_index(
                name=settings.PINECONE_INDEX_NAME,
                dimension=settings.PINECONE_DIMENSION,
                metric=settings.PINECONE_METRIC,
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            logger.info("Pinecone index created.")
        else:
            logger.info("Pinecone index '%s' already exists.", settings.PINECONE_INDEX_NAME)

        _index = pc.Index(settings.PINECONE_INDEX_NAME)
        pinecone_connected = True
        logger.info("Pinecone connected. Stats: %s", _index.describe_index_stats())

    except Exception as exc:
        logger.exception("Failed to connect to Pinecone: %s", exc)
        pinecone_connected = False


def upsert_vectors(vectors: list[dict[str, Any]]) -> int:
    """
    Upsert a list of vector dicts into the index.

    Each dict must have:
        id:       str
        values:   list[float]  (512-dim)
        metadata: dict         (category, traditional, region, occasion, price_range, image_url)

    Returns the number of vectors upserted.
    Raises RuntimeError if not connected.
    """
    if not pinecone_connected or _index is None:
        raise RuntimeError("Pinecone is not connected.")

    _index.upsert(vectors=vectors)
    return len(vectors)


def query_vectors(
    embedding: list[float],
    top_k: int = 12,
    filter: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Query the index for the top_k most similar vectors.

    Returns a list of result dicts:
        { id, score, metadata: { image_url, category, traditional, region, occasion, price_range } }

    Raises RuntimeError if not connected.
    """
    if not pinecone_connected or _index is None:
        raise RuntimeError("Pinecone is not connected.")

    query_kwargs: dict[str, Any] = {
        "vector": embedding,
        "top_k": top_k,
        "include_metadata": True,
    }
    if filter:
        query_kwargs["filter"] = filter

    response = _index.query(**query_kwargs)

    results = []
    for match in response.get("matches", []):
        meta = match.get("metadata", {})
        results.append(
            {
                "id": match["id"],
                "score": round(float(match["score"]), 4),
                "image_url": meta.get("image_url", ""),
                "category": meta.get("category", ""),
                "traditional": bool(meta.get("traditional", False)),
                "region": meta.get("region", ""),
                "occasion": meta.get("occasion", ""),
                "price_range": meta.get("price_range", ""),
            }
        )
    return results
