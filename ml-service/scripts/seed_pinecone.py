#!/usr/bin/env python3
"""
scripts/seed_pinecone.py

Seed Cameroonian fashion images into the Pinecone index.

Usage:
  python scripts/seed_pinecone.py                   # seed all rows from CSV
  python scripts/seed_pinecone.py --dry-run          # validate without upserting
  python scripts/seed_pinecone.py --limit 20         # seed first 20 rows only
  python scripts/seed_pinecone.py --resume           # skip IDs already in Pinecone
  python scripts/seed_pinecone.py --source list      # use built-in placeholder list
"""

import argparse
import csv
import logging
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
METADATA_CSV = ROOT / "seed_data" / "metadata.csv"

# Module-level CLIP model cache (loaded once on first embedding call)
_clip_model = None
_clip_processor = None

# ── Built-in placeholder list (--source list) ─────────────────────────────
_SUPABASE_BASE = "https://placeholder.supabase.co/storage/v1/object/public/seed-images"

BUILTIN_RECORDS: list[dict[str, Any]] = [
    *[{"id": f"img_toghu_{i:03d}", "image_url": f"{_SUPABASE_BASE}/toghu_{i:03d}.jpg",
       "category": "Traditional Clothing", "traditional": True, "region": "Northwest",
       "occasion": "Wedding", "price_range": "mid-range"} for i in range(1, 51)],
    *[{"id": f"img_modern_{i:03d}", "image_url": f"{_SUPABASE_BASE}/modern_{i:03d}.jpg",
       "category": "Modern Clothing", "traditional": False, "region": "Centre",
       "occasion": "Office", "price_range": "mid-range"} for i in range(1, 51)],
    *[{"id": f"img_trad_hair_{i:03d}", "image_url": f"{_SUPABASE_BASE}/trad_hair_{i:03d}.jpg",
       "category": "Traditional Hairstyle", "traditional": True, "region": "West",
       "occasion": "Wedding", "price_range": "budget"} for i in range(1, 31)],
    *[{"id": f"img_mod_hair_{i:03d}", "image_url": f"{_SUPABASE_BASE}/mod_hair_{i:03d}.jpg",
       "category": "Modern Hairstyle", "traditional": False, "region": "Littoral",
       "occasion": "Casual", "price_range": "budget"} for i in range(1, 31)],
    *[{"id": f"img_acc_{i:03d}", "image_url": f"{_SUPABASE_BASE}/acc_{i:03d}.jpg",
       "category": "Accessories", "traditional": True, "region": "West",
       "occasion": "Wedding", "price_range": "budget"} for i in range(1, 21)],
    *[{"id": f"img_portfolio_{i:03d}", "image_url": f"{_SUPABASE_BASE}/portfolio_{i:03d}.jpg",
       "category": "Designer Portfolio", "traditional": False, "region": "Littoral",
       "occasion": "Casual", "price_range": "premium"} for i in range(1, 21)],
]


# ── CSV loader ────────────────────────────────────────────────────────────

def load_csv_records(limit: int | None = None) -> list[dict[str, Any]]:
    if not METADATA_CSV.exists():
        logger.error("metadata.csv not found at %s\nRun: python scripts/enrich_csv.py", METADATA_CSV)
        sys.exit(1)

    records = []
    with open(METADATA_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            records.append({
                "id":          row["id"],
                "filepath":    row["filepath"],
                "category":    row["category"],
                "traditional": row["traditional"].strip().lower() == "true",
                "region":      row["region"],
                "occasion":    row["occasion"],
                "price_range": row["price_range"],
            })
            if limit and len(records) >= limit:
                break

    logger.info("Loaded %d records from metadata.csv", len(records))
    return records


# ── Image helpers ─────────────────────────────────────────────────────────

def read_local_image(filepath: str) -> bytes | None:
    """Try exact path, then strip the _1 dedup suffix added by convert_and_rename.py."""
    full_path = ROOT / filepath
    if full_path.exists():
        return full_path.read_bytes()
    alt_path = ROOT / filepath.replace("_1.jpg", ".jpg")
    if alt_path.exists():
        return alt_path.read_bytes()
    logger.warning("Image not found: %s", filepath)
    return None


def download_image(url: str, timeout: float = 10.0) -> bytes | None:
    try:
        import httpx
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.content
    except Exception as exc:
        logger.warning("Download failed %s: %s", url, exc)
        return None


def make_placeholder_embedding(seed: int = 0) -> list[float]:
    """Deterministic 512-dim unit vector for dry-run / failed images."""
    import hashlib
    import struct
    digest = hashlib.sha256(str(seed).encode()).digest()
    # Build 512 floats by repeating the 8-float pattern from the digest
    base = [struct.unpack("f", digest[i * 4:(i + 1) * 4])[0] for i in range(8)]
    pattern = (base * 64)[:512]
    norm = sum(x ** 2 for x in pattern) ** 0.5 or 1.0
    return [x / norm for x in pattern]


def generate_embedding(image_bytes: bytes) -> list[float]:
    """
    Generate a real 512-dim CLIP embedding.
    Loads model on first call. Uses default HuggingFace cache (~/.cache/huggingface).
    Works with transformers v4 and v5.
    """
    import io
    import torch
    import torch.nn.functional as F
    from PIL import Image
    from transformers import CLIPModel, CLIPProcessor

    global _clip_model, _clip_processor

    if _clip_model is None:
        logger.info("Loading CLIP model from cache...")
        model_name = "openai/clip-vit-base-patch32"
        # Do NOT pass cache_dir — use the default HuggingFace cache
        # so we reuse whatever was already downloaded.
        _clip_processor = CLIPProcessor.from_pretrained(model_name)
        _clip_model = CLIPModel.from_pretrained(model_name)
        _clip_model.eval()
        logger.info("CLIP model ready.")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = _clip_processor(images=image, return_tensors="pt")

    with torch.no_grad():
        features = _clip_model.get_image_features(**inputs)

    # Transformers v5 may return a dataclass instead of a plain Tensor
    if not isinstance(features, torch.Tensor):
        # Fall back to manual projection via vision_model + visual_projection
        vision_out = _clip_model.vision_model(
            pixel_values=inputs["pixel_values"]
        )
        features = _clip_model.visual_projection(vision_out.pooler_output)

    features = F.normalize(features, p=2, dim=-1)
    result = features.squeeze(0).tolist()

    if len(result) != 512:
        raise ValueError(f"Expected 512 dims, got {len(result)}")

    return result


def validate_embedding(embedding: list[float], record_id: str) -> bool:
    """Hard guard: reject anything that isn't exactly 512 floats."""
    if not embedding or len(embedding) != 512:
        logger.error(
            "BAD EMBEDDING for %s — got %d dims (expected 512). "
            "Will use placeholder instead.",
            record_id,
            len(embedding) if embedding else 0,
        )
        return False
    return True


# ── Pinecone helpers ──────────────────────────────────────────────────────

def get_existing_ids(pc_index) -> set[str]:
    """
    Fetch all vector IDs already in the index so --resume can skip them.
    Uses list() which pages through the index.
    """
    existing: set[str] = set()
    try:
        for page in pc_index.list():
            existing.update(page)
        logger.info("Found %d existing vectors in index.", len(existing))
    except Exception as exc:
        logger.warning("Could not fetch existing IDs (non-fatal): %s", exc)
    return existing


def batch_upsert(
    pc_index,
    vectors: list[dict],
    batch_size: int = 100,
    dry_run: bool = False,
) -> int:
    total = 0
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i: i + batch_size]
        if dry_run:
            logger.info("[DRY RUN] Would upsert batch of %d vectors.", len(batch))
        else:
            pc_index.upsert(vectors=batch)
            logger.info("Upserted batch of %d (%d total so far).", len(batch), total + len(batch))
        total += len(batch)
    return total


# ── Main ──────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Pinecone with Cameroonian fashion images")
    parser.add_argument("--dry-run", action="store_true", help="Validate without upserting")
    parser.add_argument("--limit",   type=int, default=None, help="Process only first N records")
    parser.add_argument("--resume",  action="store_true", help="Skip IDs already in Pinecone")
    parser.add_argument(
        "--source",
        choices=["csv", "list"],
        default="csv",
        help="'csv' = seed_data/metadata.csv (default); 'list' = built-in placeholders",
    )
    args = parser.parse_args()

    # ── Load records ──────────────────────────────────────────────────
    if args.source == "csv":
        records = load_csv_records(limit=args.limit)
    else:
        records = BUILTIN_RECORDS[: args.limit] if args.limit else BUILTIN_RECORDS

    logger.info(
        "Processing %d records | source=%s | dry_run=%s | resume=%s",
        len(records), args.source, args.dry_run, args.resume,
    )

    # ── Connect to Pinecone ───────────────────────────────────────────
    pc_index = None
    existing_ids: set[str] = set()

    if not args.dry_run:
        from app.services import pinecone_service
        pinecone_service.connect()
        if not pinecone_service.pinecone_connected:
            logger.error("Cannot connect to Pinecone. Aborting.")
            sys.exit(1)
        pc_index = pinecone_service._index

        if args.resume:
            existing_ids = get_existing_ids(pc_index)

    # ── Process each record ───────────────────────────────────────────
    vectors:        list[dict] = []
    skipped:        int = 0
    fallback_count: int = 0
    bad_embed:      int = 0

    for idx, record in enumerate(records, start=1):
        record_id = record["id"]

        # --resume: skip records already in Pinecone
        if record_id in existing_ids:
            skipped += 1
            continue

        # Get image bytes
        if args.source == "csv":
            image_bytes = read_local_image(record["filepath"])
            image_url   = record["filepath"]
        else:
            image_bytes = download_image(record.get("image_url", ""))
            image_url   = record.get("image_url", "")

        # Generate embedding
        if args.dry_run or image_bytes is None:
            embedding = make_placeholder_embedding(seed=idx)
            if image_bytes is None:
                fallback_count += 1
        else:
            try:
                embedding = generate_embedding(image_bytes)
            except Exception as exc:
                logger.warning(
                    "[%d/%d] Embedding failed for %s: %s — using placeholder.",
                    idx, len(records), record_id, exc,
                )
                embedding = make_placeholder_embedding(seed=idx)
                fallback_count += 1

        # Hard dimension guard — never send dim-0 vectors to Pinecone
        if not validate_embedding(embedding, record_id):
            embedding = make_placeholder_embedding(seed=idx)
            bad_embed += 1
            # validate again — placeholder must always be 512
            if not validate_embedding(embedding, record_id):
                logger.error("Placeholder also invalid for %s. Skipping entirely.", record_id)
                continue

        vectors.append({
            "id":     record_id,
            "values": embedding,
            "metadata": {
                "image_url":   image_url,
                "category":    record["category"],
                "traditional": record["traditional"],
                "region":      record["region"],
                "occasion":    record["occasion"],
                "price_range": record["price_range"],
            },
        })

        if idx % 50 == 0:
            logger.info("Processed %d / %d records...", idx, len(records))

    # ── Upsert ────────────────────────────────────────────────────────
    total = batch_upsert(pc_index, vectors, batch_size=100, dry_run=args.dry_run)

    logger.info("=" * 60)
    logger.info("DONE.")
    logger.info("  Vectors %s:    %d", "validated" if args.dry_run else "upserted", total)
    logger.info("  Skipped (resume): %d", skipped)
    logger.info("  Placeholder used: %d", fallback_count)
    logger.info("  Bad embed fixed:  %d", bad_embed)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
