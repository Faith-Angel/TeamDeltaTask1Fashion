# NdoloStitch ML Service

FastAPI ML service for the NdoloStitch Cameroonian fashion platform.

Provides:
- **Visual Search** — CLIP ViT-B/32 + Pinecone cosine similarity search
- **Style Assistant** — Gemini 2.0 Flash (free tier) Cameroonian fashion consultant
- **Prometheus metrics** — request count, latency p50/p95/p99, error rate

Called exclusively through the Next.js monolith's proxy routes:
- `POST /api/ml/similar-search` → ML Service `/api/v1/similar-search`
- `POST /api/ml/style-chat` → ML Service `/api/v1/style-chat`

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.12+ |
| Docker + Docker Compose | 24+ |
| Pinecone account | Free tier |
| Google AI Studio key | Free tier (Gemini Flash) |

---

## Local Development (without Docker)

```bash
# 1. Clone and enter the ml-service directory
cd ml-service

# 2. Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
copy .env.example .env
# Edit .env and fill in ML_SERVICE_API_KEY, GOOGLE_API_KEY, PINECONE_API_KEY

# 5. Start the service
uvicorn app.main:app --reload --port 8000
```

The service starts at `http://localhost:8000`.
Interactive API docs: `http://localhost:8000/docs`

---

## Local Development (Docker)

```bash
# Build and start
docker compose up --build

# Start in background
docker compose up -d

# Follow logs
docker compose logs -f ml-service

# Stop
docker compose down
```

The CLIP model (~400 MB) is downloaded on first build and cached in the
`model-cache` Docker volume. Subsequent starts skip the download.

---

## Running Tests

```bash
# From ml-service/ directory with .venv active
pytest tests/ -v

# With coverage
pip install pytest-cov
pytest tests/ -v --cov=app --cov-report=term-missing
```

All tests mock external dependencies (CLIP, Pinecone, Gemini) so they
run offline without credentials.

---

## Seed Script

Populate the Pinecone index with 200 Cameroonian fashion images:

```bash
# Dry run — validate 200 records without upserting
python scripts/seed_pinecone.py --dry-run

# Seed all 200 records (requires PINECONE_API_KEY in .env)
python scripts/seed_pinecone.py

# Seed a subset (useful for testing)
python scripts/seed_pinecone.py --limit 20
```

**Before running for real:** replace the placeholder `image_url` values in
`scripts/seed_pinecone.py` with actual Supabase Storage public URLs from the
`seed-images` bucket (Faith's task A3).

---

## API Reference

All `/api/v1/*` endpoints require the header:
```
X-API-Key: <ML_SERVICE_API_KEY>
```

### GET /health
Public. No auth required.
```json
{
  "status": "ok",
  "clip_loaded": true,
  "pinecone_connected": true,
  "timestamp": "2026-07-22T10:00:00Z"
}
```

### POST /api/v1/generate-embedding
Upload a file (`multipart/form-data`, field `file`) or use the URL variant.
```
POST /api/v1/generate-embedding/url
{"image_url": "https://..."}
```
Response:
```json
{"embedding": [0.01, ...], "model": "clip-vit-b-32", "cached": false}
```

### POST /api/v1/similar-search
Upload a file or POST to `/api/v1/similar-search/url`:
```json
{"image_url": "https://...", "top_k": 12, "filter": {"traditional": true}}
```
Response:
```json
{
  "results": [
    {
      "id": "img_toghu_001",
      "score": 0.94,
      "image_url": "https://...",
      "category": "Traditional Wedding",
      "traditional": true,
      "region": "Northwest",
      "occasion": "Wedding",
      "price_range": "100000-500000"
    }
  ],
  "query_time_ms": 142
}
```

### POST /api/v1/style-chat
```json
{
  "message": "I need something for a Bamileke wedding",
  "conversation_id": "conv_abc123",
  "history": [],
  "extract_brief": false
}
```
Response:
```json
{
  "reply": "For a traditional Bamileke wedding...",
  "conversation_id": "conv_abc123",
  "brief": null
}
```
Set `extract_brief: true` (or include "generate brief" in the message) to
receive a `brief` object:
```json
{
  "style": "Traditional Bamileke",
  "occasion": "Wedding",
  "color_palette": ["Royal Blue", "Gold"],
  "fabric_preference": "Toghu wool",
  "budget_range_xaf": "100000-300000",
  "special_requirements": "Include a headwrap"
}
```

### GET /metrics
Prometheus metrics (public). Used by Railway/Render monitoring or a
self-hosted Prometheus scraper.

---

## Deployment to Railway

1. Push the repo to GitHub.
2. In the Railway dashboard: **New Project → Deploy from GitHub**.
3. Select the repo and set **Root Directory** to `ml-service/`.
4. Railway auto-detects the `Dockerfile` — no extra config needed.
5. Add all environment variables from `.env.example` in the Railway
   **Variables** tab.
6. Set the **Port** to `8000`.
7. Optionally enable a custom domain or use the Railway-provided URL.
8. Copy the Railway service URL and set it as `ML_SERVICE_URL` in the
   Vercel monolith environment variables (Deyo's task E1).

> **Note on cold starts:** The free Railway tier sleeps inactive services.
> The CLIP model is baked into the Docker image so cold starts take ~30–60s
> (model load) rather than 5–10 minutes (model download + load).
> Use the `/health` endpoint to probe readiness before serving traffic.

---

## Architecture Notes

- The service never stores user images. Images are processed in memory and
  discarded after embedding generation.
- Embeddings are cached in an in-process LRU cache (configurable TTL/size).
  Cache is not shared across workers — use a single worker (`--workers 1`)
  on Railway free tier.
- The circuit breaker opens after 5 consecutive failures and recovers after
  60 seconds. This prevents cascade failures from propagating to the monolith.
- Gemini free tier limits: 15 RPM, 1M TPM. Sufficient for the demo.
  Upgrade to a paid key for production load.
