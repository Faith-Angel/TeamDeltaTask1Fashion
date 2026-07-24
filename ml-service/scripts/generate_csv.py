#!/usr/bin/env python3
"""
scripts/generate_csv.py

Scans seed_data/images/<category_folder>/ for image files and generates
seed_data/metadata.csv — the source of truth for the seed script.

The CSV has these columns (matching your design exactly):
  id, filepath, category, traditional, region, occasion, price_range

Usage:
  python scripts/generate_csv.py                # generates the CSV
  python scripts/generate_csv.py --preview      # prints first 10 rows, no file written

Folder → metadata mapping:
  01_traditional_clothing  → traditional=True,  category=dress/outfit
  02_modern_clothing       → traditional=False, category=outfit
  03_traditional_hairstyles→ traditional=True,  category=hairstyle
  04_modern_hairstyles     → traditional=False, category=hairstyle
  05_accessories           → traditional varies,category=accessory
  06_designer_portfolio    → traditional varies,category=portfolio

After generating the CSV, open it in Excel or any editor and fill in
the region, occasion, and price_range columns for each image.
The script pre-fills sensible defaults that you can override.
"""

import argparse
import csv
import sys
from pathlib import Path

# ── Resolve paths relative to ml-service/ root ───────────────────────────
ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "seed_data" / "images"
OUTPUT_CSV = ROOT / "seed_data" / "metadata.csv"

# ── Default metadata per folder ───────────────────────────────────────────
FOLDER_DEFAULTS = {
    "01_traditional_clothing": {
        "category": "Traditional Clothing",
        "traditional": True,
        "region": "Littoral",         # ← edit in CSV after generation
        "occasion": "Wedding",         # ← edit in CSV after generation
        "price_range": "mid-range",    # budget | mid-range | premium
    },
    "02_modern_clothing": {
        "category": "Modern Clothing",
        "traditional": False,
        "region": "Centre",
        "occasion": "Office",
        "price_range": "mid-range",
    },
    "03_traditional_hairstyles": {
        "category": "Traditional Hairstyle",
        "traditional": True,
        "region": "Northwest",
        "occasion": "Wedding",
        "price_range": "budget",
    },
    "04_modern_hairstyles": {
        "category": "Modern Hairstyle",
        "traditional": False,
        "region": "Centre",
        "occasion": "Casual",
        "price_range": "budget",
    },
    "05_accessories": {
        "category": "Accessories",
        "traditional": True,
        "region": "West",
        "occasion": "Wedding",
        "price_range": "budget",
    },
    "06_designer_portfolio": {
        "category": "Designer Portfolio",
        "traditional": False,
        "region": "Littoral",
        "occasion": "Casual",
        "price_range": "premium",
    },
}

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
CSV_COLUMNS = ["id", "filepath", "category", "traditional", "region", "occasion", "price_range"]


def scan_images() -> list[dict]:
    """Walk all category folders and collect image file metadata."""
    records = []
    counter = 1

    for folder_name in sorted(FOLDER_DEFAULTS.keys()):
        folder_path = IMAGES_DIR / folder_name
        if not folder_path.exists():
            print(f"  [WARN] Folder not found, skipping: {folder_path.name}")
            continue

        defaults = FOLDER_DEFAULTS[folder_name]
        image_files = sorted(
            f for f in folder_path.iterdir()
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
        )

        if not image_files:
            print(f"  [INFO] No images yet in {folder_path.name} — folder included, no rows added.")
            continue

        for img_path in image_files:
            # Relative path from ml-service/ root, using forward slashes
            relative_path = img_path.relative_to(ROOT).as_posix()

            records.append({
                "id":          f"img_{counter:03d}",
                "filepath":    relative_path,
                "category":    defaults["category"],
                "traditional": defaults["traditional"],
                "region":      defaults["region"],
                "occasion":    defaults["occasion"],
                "price_range": defaults["price_range"],
            })
            counter += 1

    return records


def write_csv(records: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(records)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate seed_data/metadata.csv from image folders")
    parser.add_argument("--preview", action="store_true", help="Print rows without writing file")
    args = parser.parse_args()

    print(f"Scanning: {IMAGES_DIR}")
    records = scan_images()

    if not records:
        print("\nNo images found. Add images to the seed_data/images/ subfolders first.")
        print("Supported formats: .jpg, .jpeg, .png, .webp")
        sys.exit(0)

    print(f"\nFound {len(records)} images across {len(FOLDER_DEFAULTS)} categories.\n")

    if args.preview:
        # Print first 10 rows as a table
        header = " | ".join(f"{c:<25}" for c in CSV_COLUMNS)
        print(header)
        print("-" * len(header))
        for row in records[:10]:
            print(" | ".join(f"{str(row[c]):<25}" for c in CSV_COLUMNS))
        if len(records) > 10:
            print(f"  ... and {len(records) - 10} more rows.")
        print("\n[DRY RUN] No file written.")
    else:
        write_csv(records, OUTPUT_CSV)
        print(f"CSV written to: {OUTPUT_CSV}")
        print("\nNext steps:")
        print("  1. Open seed_data/metadata.csv in Excel or VS Code")
        print("  2. Review and adjust region, occasion, price_range per image")
        print("  3. Run: python scripts/seed_pinecone.py --source csv")


if __name__ == "__main__":
    main()
