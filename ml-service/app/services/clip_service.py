"""
CLIP ViT-B/32 embedding service.

Responsibilities:
  - Load the model once at startup via load_model().
  - Generate normalized 512-dim embeddings from PIL images.
  - Cache embeddings in an LRU cache keyed by image content hash.
  - Fetch remote images asynchronously via httpx.

Public state flags read by the /health endpoint:
  clip_loaded: bool
"""

import hashlib
import io
import logging
from functools import lru_cache

import httpx
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Module-level state ────────────────────────────────────────────────────
clip_loaded: bool = False
_model = None
_processor = None

# LRU cache: key = sha256 hex of raw image bytes, value = list[float]
# We wrap generate_embedding with a manual dict cache so we can control
# TTL and max size from settings rather than being locked into @lru_cache.
_embedding_cache: dict[str, list[float]] = {}
_cache_order: list[str] = []  # insertion-order tracker for LRU eviction


def load_model() -> None:
    """Load CLIP model and processor. Called once during app lifespan startup."""
    global clip_loaded, _model, _processor

    try:
        # Import here so tests can mock before this module-level code runs
        from transformers import CLIPModel, CLIPProcessor  # type: ignore

        _processor = CLIPProcessor.from_pretrained(
            settings.CLIP_MODEL_NAME,
            cache_dir=settings.MODEL_CACHE_DIR,
        )
        _model = CLIPModel.from_pretrained(
            settings.CLIP_MODEL_NAME,
            cache_dir=settings.MODEL_CACHE_DIR,
        )
        _model.eval()  # inference mode — no gradient tracking needed
        clip_loaded = True
    except Exception as exc:
        logger.exception("Failed to load CLIP model: %s", exc)
        clip_loaded = False


def _image_hash(image_bytes: bytes) -> str:
    """Return a hex SHA-256 digest of raw image bytes for cache keying."""
    return hashlib.sha256(image_bytes).hexdigest()


def _cache_get(key: str) -> list[float] | None:
    if key in _embedding_cache:
        # Move to end (most recently used)
        _cache_order.remove(key)
        _cache_order.append(key)
        return _embedding_cache[key]
    return None


def _cache_set(key: str, value: list[float]) -> None:
    if key in _embedding_cache:
        _cache_order.remove(key)
    elif len(_embedding_cache) >= settings.CACHE_MAX_SIZE:
        # Evict least recently used
        oldest = _cache_order.pop(0)
        del _embedding_cache[oldest]
    _embedding_cache[key] = value
    _cache_order.append(key)


def _generate_embedding_from_image(image: Image.Image) -> list[float]:
    """
    Run CLIP inference on a PIL image and return a normalized 512-dim vector.
    Raises RuntimeError if the model is not loaded.
    Compatible with all transformers versions.
    """
    if not clip_loaded or _model is None or _processor is None:
        raise RuntimeError("CLIP model is not loaded.")

    import torch
    import torch.nn.functional as F

    inputs = _processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = _model.get_image_features(**inputs)

    # Defensive: older transformers versions return a dataclass instead of a Tensor.
    # get_image_features should always return a plain Tensor for CLIP, but guard anyway.
    if not isinstance(features, torch.Tensor):
        # Try common attribute names for pooled output
        for attr in ("pooler_output", "last_hidden_state"):
            if hasattr(features, attr):
                features = getattr(features, attr)
                if isinstance(features, torch.Tensor):
                    break
        else:
            raise RuntimeError(
                f"Unexpected type from get_image_features: {type(features)}. "
                "Update transformers: pip install --upgrade transformers"
            )

    # features shape: (1, 512) — L2-normalize then flatten to list
    features = F.normalize(features, p=2, dim=-1)
    result = features.squeeze(0).tolist()

    if len(result) != 512:
        raise ValueError(f"Expected 512-dim embedding, got {len(result)}. Check model name.")

    return result


def embed_image_bytes(image_bytes: bytes) -> tuple[list[float], bool]:
    """
    Generate or retrieve cached embedding for raw image bytes.

    Returns:
        (embedding, was_cached)
    """
    key = _image_hash(image_bytes)
    cached = _cache_get(key)
    if cached is not None:
        logger.debug("Embedding cache hit for key %s", key[:12])
        return cached, True

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    embedding = _generate_embedding_from_image(image)
    _cache_set(key, embedding)
    return embedding, False


async def load_image_from_url(url: str) -> bytes:
    """
    Download an image from a public URL and return the raw bytes.
    Raises httpx.HTTPError on network failure.
    Times out after 10 seconds.
    """
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if not any(ct in content_type for ct in ("jpeg", "jpg", "png", "webp", "image")):
            raise ValueError(
                f"URL does not point to a supported image type. Got: {content_type}"
            )
        return response.content
