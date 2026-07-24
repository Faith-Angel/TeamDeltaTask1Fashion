# Implementation Plan — NdoloStitch

## Overview

NdoloStitch is built as a **Next.js 15 PWA monolith** (deployed to Vercel) plus a **separate FastAPI ML service** (deployed to Railway/Render via Docker). The four team members work in parallel streams:

- **Jeason (Frontend)**: Next.js pages, components, PWA, UI
- **Faith (Backend)**: Supabase setup, Prisma schema, API routes, Realtime
- **Gabe (MLOps)**: FastAPI ML service, CLIP, GPT-4o, Pinecone, Docker
- **Deyo (DevOps)**: Vercel, CI/CD, Railway, monitoring, Lighthouse

Tasks are grouped by stream. Each stream can progress in parallel after Day 1 foundation tasks are complete.

---

## Tasks

### STREAM A — Foundation (All team, Day 1)

- [ ] A1. Initialize Next.js 15 monolith project
  - `npx create-next-app@15 ndolostitch --typescript --tailwind --eslint --app --src-dir=no`
  - Install: `@supabase/supabase-js @supabase/ssr prisma @prisma/client zustand @tanstack/react-query react-hook-form zod lucide-react framer-motion react-leaflet leaflet @serwist/next`
  - Install shadcn/ui: `npx shadcn@latest init` (choose slate base, CSS variables)
  - Add shadcn components: button, input, card, calendar, badge, avatar, dialog, sheet, toast, tabs, dropdown-menu
  - Configure TailwindCSS 4 with Afrocentric palette tokens in `tailwind.config.ts`
  - _Requirements: 2.6, 11.1_

- [ ] A2. Configure Afrocentric theme and global layout
  - Add palette to `tailwind.config.ts`: kente-gold #FFC107, sahara-sunset #FF6F00, congo-royale #4A148C, bamileke-earth #5D4037, savanna-bloom #558B2F
  - Create `app/layout.tsx` with font (Geist), ThemeProvider, ReactQueryProvider, Toaster
  - Create `components/layout/Header.tsx` (logo, nav, auth state), `Sidebar.tsx`, `MobileNav.tsx`
  - _Requirements: 2.6_

- [ ] A3. Set up Supabase project and Prisma schema
  - Create Supabase project (production), copy URL and keys to `.env.local`
  - Write full `prisma/schema.prisma` from design.md data models
  - Run `npx prisma migrate dev --name init`
  - Configure Supabase Auth: enable Phone OTP, set SMS provider (Twilio or Vonage)
  - Create Supabase Storage buckets: `portfolio-images`, `listing-images`, `marketer-files`, `seed-images`
  - Set bucket policies: public read, authenticated write
  - _Requirements: 1.5, 1.6, 4.7, 8.8_

- [ ] A4. Configure PWA (@serwist/next)
  - Install `@serwist/next` and create `next.config.ts` with `withSerwist` wrapper
  - Create `app/sw.ts` (Service Worker): cache home shell, static assets, feed page
  - Create `public/manifest.json` with NdoloStitch name, Afrocentric theme_color, 192+512 icons
  - Add `app/offline/page.tsx` — offline fallback page
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

---

### STREAM B — Backend / Auth / API (Faith, Days 1–3)

- [ ] B1. Implement Supabase Auth integration (Phone OTP)
  - Create `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server, uses cookies via `@supabase/ssr`)
  - Create `app/(auth)/login/page.tsx`: phone input → `supabase.auth.signInWithOtp({phone})` → OTP input screen → `supabase.auth.verifyOtp({phone, token, type: 'sms'})`
  - Create `app/(auth)/register/page.tsx`: collect fullName, phone, location, role (+ marketerSubRole if Marketer) → validate with Zod → send OTP → verify → create User record in Prisma
  - Implement `app/api/auth/[...supabase]/route.ts` (Supabase Auth callback handler via `@supabase/ssr`)
  - Implement middleware (`middleware.ts`) to protect role-specific routes
  - _Requirements: 1.1–1.11_

- [ ] B2. Implement Designer API routes
  - `GET /api/designers` — filter by location, category, price_range, rating; cursor-based pagination; full-text search by name/location; returns within 3s
  - `GET /api/designers/[id]` — full profile with up to 20 portfolio images, rating, availability, reviews
  - `PATCH /api/designers/[id]/availability` — toggle availability (Server Action)
  - `POST /api/designers/[id]/portfolio` — validate MIME + size ≤10MB → Supabase Storage upload → Prisma PortfolioImage record
  - `POST /api/designers/[id]/reviews` — score 1–5; recompute rankingScore = mean(all scores) via Prisma
  - _Requirements: 6.1–6.8_

- [ ] B3. Implement Booking and Appointment API routes
  - `POST /api/bookings` — create Appointment (Server Action); validate date, location, notes; notify Designer via Supabase Realtime
  - `PATCH /api/bookings/[id]` — update status (Confirm, Mark Attended, Mark Delivered, Cancel); validate transition rules; notify Client
  - `GET /api/appointments` — list appointments for the authenticated Designer
  - _Requirements: 6.8, 7.5, 7.6_

- [ ] B4. Implement Marketplace and Order API routes
  - `GET /api/marketplace` — filter by category, region, price; cursor pagination; listings visible within 60s of publish
  - `GET /api/marketplace/[id]` — listing detail
  - `POST /api/vendor/listings` — create listing (Server Action); validate all fields with Zod; Supabase Storage for images
  - `PATCH /api/vendor/listings/[id]` — update; toggle inStock
  - `POST /api/orders` — validate cart, confirm all inStock=true, create Order, initiate payment
  - `PATCH /api/orders/[id]` — update pipelineStatus (Designer Kanban) or deliveryStatus (Vendor); notify via Realtime
  - _Requirements: 8.1–8.8_

- [ ] B5. Implement Real-Time Chat (Supabase Realtime)
  - `POST /api/conversations` — create conversation between Client and Designer
  - `GET /api/conversations/[id]/messages` — paginated message history
  - `POST /api/conversations/[id]/messages` — send message (text or image via Supabase Storage)
  - Subscribe to Supabase Realtime channel `conversation:{id}` on the client for live delivery
  - Read receipts: update `deliveryStatus` to Read when recipient opens thread
  - _Requirements: 9.1–9.6_

- [ ] B6. Implement Notification Service
  - Create `app/api/notifications/route.ts` — GET paginated notifications; PATCH mark-read
  - Use Supabase Realtime `notifications` channel for in-app toasts (≤3s when app open)
  - Register Web Push subscription (`navigator.serviceWorker.pushManager.subscribe`) and store endpoint in Supabase
  - Trigger push via Inngest background job on: new appointment request, order status change, new message
  - _Requirements: 10.1–10.4_

- [ ] B7. Implement ML Proxy Routes with circuit breaker
  - Create `lib/circuit-breaker.ts`: CLOSED/OPEN/HALF_OPEN states, threshold=5 failures, timeout=60s
  - Create `app/api/ml/similar-search/route.ts`: validate file (MIME, ≤10MB) → forward to ML Service with `X-API-Key` → on 503/open circuit return graceful fallback
  - Create `app/api/ml/style-chat/route.ts`: validate message (1–2000 chars) → forward to ML Service → on failure return friendly error
  - _Requirements: 12.5, 12.6_

---

### STREAM C — Frontend / UI (Jeason, Days 1–3)

- [ ] C1. Build authentication UI pages
  - `app/(auth)/login/page.tsx` — phone input with E.164 validation, OTP verification step, loading states, error messages
  - `app/(auth)/register/page.tsx` — full form with Zod validation, role picker, marketerSubRole conditional field, inline errors
  - Apply Afrocentric palette, 44px minimum touch targets, aria-labels on all inputs
  - _Requirements: 1.1–1.11_

- [ ] C2. Build Inspiration Feed page
  - `app/(client)/feed/page.tsx` — masonry grid (CSS columns or Masonry library), infinite scroll via Intersection Observer + React Query
  - `components/feed/CategoryTabs.tsx` — "Traditional" / "Non-Traditional" tabs
  - `components/feed/FeedCard.tsx` — image, style tags, hover overlay with "Find Similar" and "Style This" buttons
  - Guest mode: render feed read-only (no action buttons), "Sign in to interact" prompt on hover
  - _Requirements: 3.1–3.5_

- [ ] C3. Build Visual Search page
  - `app/(client)/visual-search/page.tsx`
  - `components/visual-search/ImageDropzone.tsx` — drag-and-drop + click to upload; validate MIME (jpeg/png/webp) and size ≤10MB client-side; preview uploaded image
  - On upload → POST to `/api/ml/similar-search` → loading skeleton → `components/visual-search/ResultsGrid.tsx`
  - ResultsGrid: 3-column grid, each card shows image, category tag, designer name, "View Designer" link
  - On ML unavailable: friendly "Visual search is temporarily unavailable" banner
  - _Requirements: 4.1–4.6_

- [ ] C4. Build Style Assistant page
  - `app/(client)/style-assistant/page.tsx`
  - `components/style-assistant/ChatInterface.tsx` — chat bubble UI, message input (max 2000 chars, char counter), send button, "Generate Brief" button
  - POST to `/api/ml/style-chat` on send; stream response or show loading state; conversation history stored in component state
  - `components/style-assistant/BriefCard.tsx` — structured brief display (style, occasion, color palette chips, fabric, budget, requirements); copy button; "Send to Designer" button
  - _Requirements: 5.1–5.7_

- [ ] C5. Build Designer Directory and Profile pages
  - `app/(client)/designers/page.tsx` — filter sidebar (category, region, price, rating), search bar, designer cards grid
  - `components/designer/DesignerCard.tsx` — name, location, rating stars, specialization tags, portfolio thumbnail
  - `app/(client)/designers/[id]/page.tsx` — portfolio gallery (up to 20 images), rating, availability badge, Leaflet map, reviews, "Book Appointment" CTA
  - `components/designer/BookingForm.tsx` — shadcn/ui calendar date picker, location input, details textarea, submit Server Action
  - _Requirements: 6.1–6.8_

- [ ] C6. Build Designer Dashboard
  - `app/(designer)/dashboard/page.tsx` — stats cards (orders, appointments, revenue, ranking)
  - `components/dashboard/KanbanBoard.tsx` — 5 columns (New/InProgress/Fitting/Ready/Delivered); drag-and-drop order cards via `@hello-pangea/dnd`; Server Action on drop to update pipelineStatus
  - `components/dashboard/AppointmentCalendar.tsx` — shadcn/ui calendar; appointment dots per day; click day to see list; Confirm/Attend/Deliver/Cancel actions
  - `app/(designer)/dashboard/campaigns/page.tsx` — campaign creation form and listing of active campaigns
  - _Requirements: 7.1–7.7_

- [ ] C7. Build Marketplace, Cart, and Checkout
  - `app/(client)/marketplace/page.tsx` — category tabs, region + price range filters, listing cards grid
  - `app/(client)/marketplace/[id]/page.tsx` — image carousel, description, price, "Add to Cart"
  - `stores/cartStore.ts` (Zustand): items, addItem, removeItem, clear, total, itemCount
  - `components/marketplace/CartDrawer.tsx` — slide-over cart panel, item list, subtotal, "Checkout" button
  - Checkout page: order summary, PaymentMethodSelector (MTN MoMo / Orange Money), confirm → POST /api/orders
  - _Requirements: 8.1–8.8_

- [ ] C8. Build Chat UI
  - `app/chat/page.tsx` — conversation list sorted by most recent message
  - `app/chat/[conversationId]/page.tsx` — message thread with `components/chat/MessageBubble.tsx` (text/image, timestamp, read receipt)
  - `components/chat/MessageInput.tsx` — text input (max 2000 chars), image attachment button, send button
  - Subscribe to Supabase Realtime `conversation:{id}` for live messages
  - _Requirements: 9.1–9.6_

- [ ] C9. PWA polish: install prompt and offline page
  - Implement `beforeinstallprompt` event handler to show custom install banner
  - `app/offline/page.tsx` — Afrocentric styled offline page with retry button
  - Loading skeletons for feed, directory, and marketplace cards
  - Error boundaries on all main sections
  - Framer Motion page transitions
  - _Requirements: 11.1–11.5_

---

### STREAM D — MLOps / ML Service (Gabe, Days 1–3)

- [ ] D1. Scaffold FastAPI ML service project structure
  - Create `ml-service/` directory with full layout from design.md
  - Create all `__init__.py` files
  - Create `app/main.py` entry point: FastAPI app instance, lifespan context manager (model load + Pinecone connect on startup), router registration, CORS, exception handlers
  - _Requirements: 12.1_

- [ ] D2. Implement config and security modules
  - `app/core/config.py`: Pydantic `BaseSettings` loading all env vars from `.env`; validate required fields on startup
  - `app/core/security.py`: FastAPI dependency `verify_api_key` — reads `X-API-Key` header, compares to `settings.ML_SERVICE_API_KEY` using `secrets.compare_digest`; raises HTTP 401 if missing or invalid
  - Apply `verify_api_key` dependency to all non-health routes
  - _Requirements: 12.2_

- [ ] D3. Implement CLIP embedding service
  - `app/services/clip_service.py`:
    - Load `openai/clip-vit-base-patch32` via `transformers` (CLIPModel + CLIPProcessor) at startup
    - `generate_embedding(image: PIL.Image) -> list[float]`: preprocess → model.get_image_features → normalize → return 512-dim list
    - `load_image_from_url(url: str) -> PIL.Image`: async HTTP GET via `httpx`
    - In-memory LRU cache (functools.lru_cache or cachetools.LRUCache) keyed by image hash; TTL = `settings.CACHE_TTL_SECONDS` (default 3600)
    - If model fails to load at startup: set `clip_loaded = False`; return HTTP 503 on embedding endpoints
  - _Requirements: 12.3, 12.10_

- [ ] D4. Implement Pinecone client service
  - `app/services/pinecone_service.py`:
    - Connect to Pinecone using `pinecone-client` with `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`
    - `get_or_create_index(name, dimension=512, metric="cosine")`: create index if it does not exist
    - `upsert_vectors(vectors: list[dict])`: upsert batch of `{id, values, metadata}` dicts
    - `query_vectors(embedding: list[float], top_k: int, filter: dict | None) -> list[dict]`: query index and return matches with metadata
    - If connection fails at startup: set `pinecone_connected = False`; return HTTP 503 on search endpoints
  - _Requirements: 12.4_

- [ ] D5. Implement /health endpoint
  - `app/api/v1/endpoints/health.py`
  - `GET /health` (no API key required)
  - Returns: `{ status, clip_loaded, pinecone_connected, timestamp }`
  - `status` = "ok" only when both clip_loaded=True and pinecone_connected=True, else "degraded"
  - _Requirements: 12.1_

- [ ] D6. Implement /api/v1/generate-embedding endpoint
  - `app/api/v1/endpoints/embeddings.py`
  - `POST /api/v1/generate-embedding` (requires API key)
  - Accept: multipart `file` upload OR JSON body `{ "image_url": "..." }`
  - Validate: MIME in {jpeg, png, webp}, size ≤ 10MB
  - Call `clip_service.generate_embedding()` → return `{ embedding, model, cached }`
  - If CLIP not loaded → 503; if invalid input → 422
  - _Requirements: 12.1, 12.3_

- [ ] D7. Implement /api/v1/similar-search endpoint
  - `app/api/v1/endpoints/search.py`
  - `POST /api/v1/similar-search` (requires API key)
  - Accept: multipart `file` OR JSON `{ "image_url", "top_k": 12, "filter": {} }`
  - Generate embedding → query Pinecone → return ranked results list with metadata
  - Record `query_time_ms` and return in response
  - If Pinecone not connected → 503 with `{"detail": "Vector search unavailable"}`
  - _Requirements: 4.2, 4.3, 12.1_

- [ ] D8. Implement Gemini Flash style assistant service
  - `app/services/gemini_service.py`:
    - System prompt: Cameroonian fashion consultant persona, redirect off-topic questions politely
    - `chat(message: str, history: list[dict]) -> str`: call Google Generative AI SDK (`google-generativeai`) with model `gemini-2.0-flash`; pass full history as Gemini `contents` list; max_history = 20 turns
    - `extract_brief(history: list[dict]) -> dict`: second Gemini call instructed to return structured JSON with fields: style, occasion, color_palette, fabric_preference, budget_range_xaf, special_requirements; use `response_mime_type="application/json"`
    - Handle Google API errors and timeouts (10s via `asyncio.wait_for`)
    - Free tier: gemini-2.0-flash — 15 RPM, 1M TPM, no cost
  - _Requirements: 5.2, 5.3, 5.4, 5.7_

- [ ] D9. Implement /api/v1/style-chat endpoint
  - `app/api/v1/endpoints/style_chat.py`
  - `POST /api/v1/style-chat` (requires API key)
  - Request: `{ message, conversation_id, history, extract_brief }`
  - Call `gemini_service.chat()` → if `extract_brief=True` or "generate brief" in message call `gemini_service.extract_brief()`
  - Return: `{ reply, conversation_id, brief | null }`
  - On Gemini timeout → 504 with friendly error
  - _Requirements: 5.1–5.6, 12.1_

- [ ] D10. Implement circuit breaker
  - `app/core/circuit_breaker.py`: thread-safe CLOSED/OPEN/HALF_OPEN state machine
  - Threshold: 5 consecutive failures → OPEN; timeout: 60s → HALF_OPEN; probe success → CLOSED
  - Integrate as a decorator on `clip_service` and `pinecone_service` calls
  - When OPEN: raise `CircuitOpenError` → endpoint returns 503 `{"detail": "Circuit open, try again shortly"}`
  - _Requirements: 12.5_

- [ ] D11. Implement Prometheus metrics endpoint
  - Install `prometheus-fastapi-instrumentator`
  - Add `Instrumentator().instrument(app).expose(app)` in `main.py`
  - Provides `/metrics` with: request count, latency (p50/p95/p99), error rate — all per endpoint
  - _Requirements: 12.8_

- [ ] D12. Build seed data script
  - `scripts/seed_pinecone.py`:
    - Define 200 Cameroonian fashion image records as a Python list of dicts with metadata: id, image_url (Supabase Storage public URL placeholder), category, traditional, region, occasion, price_range
    - For each image: download from URL (or use local file path) → generate CLIP embedding → upsert to Pinecone
    - Batch upsert in groups of 100 for efficiency
    - Log progress: "Seeded X/200 images"
    - Add `--dry-run` flag to validate without upserting
  - _Requirements: 4.7, 12.7, 12.9_

- [ ] D13. Write Dockerfile (multi-stage build)
  - Stage 1 (`builder`): `python:3.12-slim`, install all requirements, download CLIP model to `/model-cache`
  - Stage 2 (`runtime`): copy installed packages and model cache from builder, copy `app/` source
  - `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
  - Non-root user for security
  - `.dockerignore` to exclude scripts, tests, **pycache**
  - _Requirements: 12.7_

- [ ] D14. Write docker-compose.yml
  - Service `ml-service`: build from `./Dockerfile`, port `8000:8000`, env_file `.env`, restart `unless-stopped`
  - Volume mount for model cache to avoid re-downloading on container restart
  - Health check: `GET http://localhost:8000/health`
  - _Requirements: 12.7_

- [ ] D15. Write requirements.txt with pinned versions
  - `fastapi==0.115.0`
  - `uvicorn[standard]==0.30.6`
  - `pydantic-settings==2.4.0`
  - `transformers==4.44.2`
  - `torch==2.4.1` (CPU build for Railway; GPU optional)
  - `Pillow==10.4.0`
  - `httpx==0.27.2`
  - `openai==1.45.0` # kept as optional dep; not used — replaced by Gemini
  - `google-generativeai==0.8.3`
  - `pinecone-client==4.1.0`
  - `cachetools==5.5.0`
  - `prometheus-fastapi-instrumentator==7.0.0`
  - `pytest==8.3.3`
  - `pytest-asyncio==0.24.0`
  - `httpx[test]` (for TestClient)
  - _Requirements: 12.1_

- [ ] D16. Write tests for ML service
  - `tests/test_health.py`: GET /health returns 200 with correct fields
  - `tests/test_embeddings.py`: POST /api/v1/generate-embedding with valid image URL returns 512-dim embedding; invalid MIME returns 422; missing API key returns 401
  - `tests/test_search.py`: POST /api/v1/similar-search with valid image returns results list; each result has required metadata fields
  - `tests/test_style_chat.py`: POST /api/v1/style-chat returns reply; extract_brief=true returns non-null brief with all required fields
  - Use `pytest-asyncio` and FastAPI `TestClient`; mock CLIP and Gemini calls with `unittest.mock`
  - _Requirements: 12.1–12.10_

- [ ] D17. Write .env.example and ml-service/README.md
  - `.env.example`: all required env vars with placeholder values and inline comments
  - `README.md`: setup instructions (local dev, Docker), API endpoint reference, seed script usage, deployment to Railway guide
  - _Requirements: 12.1_

---

### STREAM E — DevOps (Deyo, Days 1–3)

- [ ] E1. Vercel project setup and environment configuration
  - Create Vercel project linked to GitHub repo
  - Configure all environment variables (Supabase, Prisma, ML Service URL + key, Upstash, Inngest)
  - Enable preview deployments on PRs
  - Configure `vercel.json` with security headers: CSP, HSTS, X-Frame-Options
  - _Requirements: 13.1, 13.4_

- [ ] E2. Set up Railway ML service deployment
  - Create Railway project, link to `ml-service/` subdirectory, configure Docker build
  - Set all ML service environment variables in Railway dashboard
  - Configure health check endpoint and restart policy
  - _Requirements: 13.2_

- [ ] E3. GitHub Actions CI/CD pipeline
  - `.github/workflows/ci.yml`: on PR → checkout → install deps → `tsc --noEmit` → `eslint` → `next build`
  - `.github/workflows/ml-ci.yml`: on PR (paths: ml-service/\*\*) → Python 3.12 → install requirements → `pytest tests/`
  - _Requirements: 13.3_

- [ ] E4. Provision Supabase, Pinecone, and Upstash
  - Supabase: create production project, apply Prisma migrations, configure RLS policies
  - Pinecone: create `ndolostitch-fashion` index (512 dims, cosine)
  - Upstash: create Redis instance, copy REST URL and token to Vercel env vars
  - _Requirements: 13.4_

- [ ] E5. Performance and PWA audit
  - Run Lighthouse CI on Vercel preview URL
  - Target: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90, PWA 100
  - Configure `next/image` for all images (automatic WebP optimization)
  - Enable Vercel Edge Network CDN for static assets
  - _Requirements: 11.6, 13.5_

- [ ] E6. Monitoring setup
  - Install Sentry: `@sentry/nextjs` on monolith, `sentry-sdk` in ML service
  - Configure Vercel Analytics for Core Web Vitals tracking
  - Set up uptime monitor (UptimeRobot or Better Uptime) on both Vercel URL and Railway ML service
  - _Requirements: 13.5_

---

## Day-by-Day Summary

### Day 1 — Foundation

| Who    | Focus                                               |
| ------ | --------------------------------------------------- |
| Jeason | A1, A2, C1 — scaffold, theme, auth UI               |
| Faith  | A3, B1 — Supabase, Prisma schema, Auth routes       |
| Gabe   | D1, D2, D3 — FastAPI scaffold, CLIP service         |
| Deyo   | A4, E1, E4 — PWA config, Vercel, infra provisioning |

### Day 2 — Core Features

| Who    | Focus                                                                 |
| ------ | --------------------------------------------------------------------- |
| Jeason | C2, C3, C4, C5 — Feed, Visual Search, Style Assistant, Designer pages |
| Faith  | B2, B3, B4, B7 — Designer API, Bookings, Marketplace, ML proxy        |
| Gabe   | D4, D5, D6, D7, D8, D9 — Pinecone, all ML endpoints, GPT-4o           |
| Deyo   | E2, E3, E5 — Railway deploy, CI/CD, Lighthouse                        |

### Day 3 — Polish + Integration

| Who    | Focus                                                                                        |
| ------ | -------------------------------------------------------------------------------------------- |
| Jeason | C6, C7, C8, C9 — Designer Dashboard, Marketplace, Chat, PWA polish                           |
| Faith  | B5, B6 — Realtime Chat, Notifications                                                        |
| Gabe   | D10, D11, D12, D13, D14, D15, D16, D17 — Circuit breaker, metrics, seed, Docker, tests, docs |
| Deyo   | E6 — Monitoring, final Lighthouse audit, demo environment                                    |

---

## Notes

- All list API endpoints use **cursor-based pagination** — never offset-based.
- Next.js 15 is chosen over 16 because it has 9+ months of production stability; Next.js 16 RC is too new for a 3-day deadline.
- The ML Service is always called through the monolith's proxy routes (`/api/ml/*`) — the client never talks directly to the ML Service.
- CLIP model is downloaded once into a Docker volume at build time to avoid cold-start delays.
- The ML Service and monolith share a single shared secret (`ML_SERVICE_API_KEY`) for authentication.
- All Supabase Storage buckets are public-read to allow CDN delivery of portfolio and listing images.
- Prisma `DATABASE_URL` uses the Supabase connection pooler (port 6543) for serverless; `DIRECT_URL` uses direct connection (port 5432) for migrations.
