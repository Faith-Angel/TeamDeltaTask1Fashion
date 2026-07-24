# ─────────────────────────────────────────────────────────────────────────
# NdoloStitch ML Service — Multi-stage Dockerfile
#
# Stage 1 (builder): install Python dependencies + pre-download CLIP model.
# Stage 2 (runtime): lean image with only what's needed to run the service.
#
# Model cache is written to /model-cache and mounted as a named Docker volume
# so the model is only downloaded once, not on every container restart.
# ─────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ──────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# System deps for Pillow, httpx, and PyTorch CPU build
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
        libssl-dev \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# Pre-download the CLIP model into /model-cache
# This bakes the model into the image layer so Railway/Render doesn't
# need to download it at runtime (slow cold start on free tier).
ENV TRANSFORMERS_CACHE=/model-cache
ENV HF_HOME=/model-cache
RUN python -c "\
from transformers import CLIPModel, CLIPProcessor; \
CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32', cache_dir='/model-cache'); \
CLIPModel.from_pretrained('openai/clip-vit-base-patch32', cache_dir='/model-cache'); \
print('CLIP model cached successfully.')"


# ── Stage 2: runtime ──────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy pre-downloaded model cache
COPY --from=builder /model-cache /model-cache

# System runtime deps (Pillow needs libjpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy application source
COPY app/ ./app/

# Non-root user for security
RUN useradd --create-home --shell /bin/bash mluser
USER mluser

# Environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TRANSFORMERS_CACHE=/model-cache
ENV HF_HOME=/model-cache
ENV MODEL_CACHE_DIR=/model-cache

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
