# Design Document — NdoloStitch

## Overview

NdoloStitch is a Next.js 15 Progressive Web App (PWA) connecting Clients, Designers, Vendors, and Marketers in Cameroon's fashion ecosystem. It uses a **monolith-first** architecture: all frontend pages and backend API logic live in a single Next.js 15 app deployed to Vercel. A **separate FastAPI ML service** (Python 3.12) handles CLIP visual search and GPT-4o style chat, deployed independently to Railway/Render.

Key design goals:

- Single Next.js 15 codebase (App Router) for frontend + backend
- Supabase for auth (Phone OTP), PostgreSQL, Storage, and Realtime
- Prisma ORM for type-safe database access
- FastAPI ML service isolated for independent scaling and crash isolation
- PWA with Service Worker (via @serwist/next) for offline support and installability
- Mobile-first responsive design with TailwindCSS 4 + shadcn/ui
- Afrocentric visual identity

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / PWA Client                         │
│  Next.js 15 App Router — React Server Components + Client       │
│  TailwindCSS 4 · shadcn/ui · Zustand · React Query · Leaflet   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / Server Actions / RSC
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js 15 Monolith (Vercel)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │ App Router  │  │ API Routes   │  │ Server Actions           ││
│  │ Pages/Layouts│  │ /api/*       │  │ (mutations, auth)        ││
│  └─────────────┘  └──────────────┘  └─────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ML Proxy Routes                                          │   │
│  │  /api/ml/similar-search  →  ML Service                   │   │
│  │  /api/ml/style-chat      →  ML Service                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Prisma ORM  ←→  Supabase PostgreSQL                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────┬──────────────────────────────────────┬──────────────────┘
        │ Supabase SDK                          │ HTTP + X-API-Key
        ▼                                       ▼
┌───────────────────┐              ┌────────────────────────────┐
│  Supabase          │              │  FastAPI ML Service         │
│  · Auth (OTP)      │              │  (Railway / Render)         │
│  · PostgreSQL 15   │              │                             │
│  · Storage (S3)    │              │  CLIP ViT-B/32 (HuggingFace)│
│  · Realtime (WS)   │              │  GPT-4o (OpenAI API)        │
│  · Redis (Upstash) │              │  Pinecone vector DB         │
└───────────────────┘              └────────────────────────────┘
```

---

## Technology Stack

| Concern         | Choice                                  | Reason                                     |
| --------------- | --------------------------------------- | ------------------------------------------ |
| Framework       | Next.js 15 (App Router)                 | Stable, RSC, Server Actions, single deploy |
| Language        | TypeScript 5.7                          | Type safety end-to-end                     |
| Styling         | TailwindCSS 4 + shadcn/ui               | Rapid UI, accessible components            |
| State (client)  | Zustand 4                               | Minimal, hooks-based, no boilerplate       |
| Server state    | TanStack React Query                    | Caching, background refetch, mutations     |
| Forms           | React Hook Form + Zod                   | Validation matches backend schemas         |
| Maps            | Leaflet (react-leaflet)                 | Free, no API key required                  |
| Calendar        | shadcn/ui calendar                      | Built-in, design consistent                |
| Animations      | Framer Motion                           | Smooth transitions                         |
| Icons           | Lucide React                            | Tree-shakeable, consistent                 |
| PWA             | @serwist/next                           | Stable Service Worker for Next.js 15       |
| Database ORM    | Prisma                                  | Type-safe, works with Supabase PG          |
| Auth            | Supabase Auth (Phone OTP)               | Native to Supabase stack                   |
| Database        | Supabase PostgreSQL 15                  | Managed, RLS, Realtime                     |
| Storage         | Supabase Storage                        | S3-compatible, integrated                  |
| Realtime        | Supabase Realtime                       | WebSocket-based, row-level events          |
| Cache           | Redis via Upstash                       | Serverless Redis, ML response caching      |
| Background jobs | Inngest                                 | Serverless functions, SMS reminders        |
| ML Framework    | FastAPI (Python 3.12)                   | Python ecosystem for ML                    |
| Vision model    | CLIP ViT-B/32 (HuggingFace)             | Zero-shot visual search, no training       |
| Chat model      | Gemini 2.0 Flash (Google AI, free tier) | Zero API cost, fast, 1M token context      |
| Vector DB       | Pinecone                                | Managed, fast ANN search                   |
| ML Container    | Docker (multi-stage)                    | Reproducible, portable                     |
| ML Deploy       | Railway or Render                       | Docker-native, affordable GPU              |
| Hosting         | Vercel                                  | Next.js-native, edge network               |
| CI/CD           | GitHub Actions                          | Standard, free for public repos            |
| Monitoring      | Vercel Analytics + Sentry               | Performance + error tracking               |

---

## Monolith Directory Structure

```
ndolostitch/                          ← Next.js 15 monolith root
├── app/
│   ├── layout.tsx                    ← Root layout (font, theme, providers)
│   ├── page.tsx                      ← Home / landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (client)/
│   │   ├── feed/page.tsx             ← Inspiration Feed (masonry grid)
│   │   ├── designers/
│   │   │   ├── page.tsx              ← Designer Directory
│   │   │   └── [id]/page.tsx         ← Designer Profile
│   │   ├── marketplace/
│   │   │   ├── page.tsx              ← Marketplace
│   │   │   └── [id]/page.tsx         ← Listing Detail
│   │   ├── cart/page.tsx
│   │   ├── visual-search/page.tsx    ← Visual Search (CLIP)
│   │   └── style-assistant/page.tsx  ← Style Assistant (GPT-4o)
│   ├── (designer)/
│   │   └── dashboard/
│   │       ├── page.tsx              ← Designer Dashboard (stats, Kanban, calendar)
│   │       ├── orders/page.tsx
│   │       ├── appointments/page.tsx
│   │       └── campaigns/page.tsx
│   ├── (vendor)/
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── catalog/page.tsx
│   │       └── orders/page.tsx
│   ├── (marketer)/
│   │   └── dashboard/page.tsx
│   ├── chat/
│   │   ├── page.tsx                  ← Conversation list
│   │   └── [conversationId]/page.tsx ← Chat thread
│   ├── offline/page.tsx              ← Offline fallback
│   └── api/
│       ├── auth/[...supabase]/route.ts
│       ├── ml/
│       │   ├── similar-search/route.ts  ← Proxy → ML Service
│       │   └── style-chat/route.ts      ← Proxy → ML Service
│       ├── designers/route.ts
│       ├── designers/[id]/route.ts
│       ├── bookings/route.ts
│       ├── orders/route.ts
│       ├── marketplace/route.ts
│       └── notifications/route.ts
├── components/
│   ├── ui/                           ← shadcn/ui base components
│   ├── feed/
│   │   ├── MasonryGrid.tsx
│   │   ├── FeedCard.tsx
│   │   └── CategoryTabs.tsx
│   ├── visual-search/
│   │   ├── ImageDropzone.tsx
│   │   └── ResultsGrid.tsx
│   ├── style-assistant/
│   │   ├── ChatInterface.tsx
│   │   └── BriefCard.tsx
│   ├── designer/
│   │   ├── DesignerCard.tsx
│   │   ├── DesignerProfile.tsx
│   │   ├── BookingForm.tsx
│   │   └── PortfolioGrid.tsx
│   ├── dashboard/
│   │   ├── StatsCards.tsx
│   │   ├── KanbanBoard.tsx
│   │   └── AppointmentCalendar.tsx
│   ├── marketplace/
│   │   ├── ListingCard.tsx
│   │   └── CartDrawer.tsx
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   └── MessageInput.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MobileNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Browser Supabase client
│   │   └── server.ts                 ← Server Supabase client (cookies)
│   ├── prisma.ts                     ← Prisma client singleton
│   ├── ml-client.ts                  ← Typed HTTP client for ML Service
│   ├── circuit-breaker.ts            ← Circuit breaker for ML calls
│   └── utils.ts
├── stores/
│   ├── authStore.ts                  ← Zustand: session, user
│   ├── cartStore.ts                  ← Zustand: cart items
│   └── uiStore.ts                    ← Zustand: theme, toasts
├── prisma/
│   └── schema.prisma                 ← Full Prisma schema
├── public/
│   ├── manifest.json                 ← PWA manifest
│   ├── sw.js                         ← Service Worker (generated by @serwist/next)
│   └── icons/                        ← PWA icons (192, 512)
├── next.config.ts                    ← @serwist/next config
└── serwist.config.ts                 ← Service Worker config
```

---

## ML Service Directory Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                       ← FastAPI app, lifespan, router registration
│   ├── core/
│   │   ├── config.py                 ← Pydantic BaseSettings (env vars)
│   │   ├── security.py               ← API key auth dependency
│   │   └── circuit_breaker.py        ← Circuit breaker implementation
│   ├── services/
│   │   ├── clip_service.py           ← CLIP ViT-B/32 load + embed
│   │   ├── pinecone_service.py       ← Pinecone client, upsert, query
│   │   └── gemini_service.py         ← Gemini Flash chat + brief extraction
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py             ← Aggregates all v1 routers
│   │       └── endpoints/
│   │           ├── health.py         ← GET /health
│   │           ├── embeddings.py     ← POST /api/v1/generate-embedding
│   │           ├── search.py         ← POST /api/v1/similar-search
│   │           └── style_chat.py     ← POST /api/v1/style-chat
│   └── models/
│       ├── requests.py               ← Pydantic request models
│       └── responses.py              ← Pydantic response models
├── scripts/
│   └── seed_pinecone.py              ← Seed 200 fashion images into Pinecone
├── tests/
│   ├── test_health.py
│   ├── test_embeddings.py
│   ├── test_search.py
│   └── test_style_chat.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Data Models (Prisma Schema)

```prisma
model User {
  id                String    @id @default(uuid())
  supabaseId        String    @unique
  fullName          String
  phone             String    @unique
  location          String
  role              Role
  marketerSubRole   MarketerSubRole?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  designer          Designer?
  vendor            Vendor?
  marketer          Marketer?
}

enum Role { Client Designer Vendor Marketer }
enum MarketerSubRole { Model Content_Creator }

model Designer {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  bio               String?
  portfolioImages   PortfolioImage[]
  rankingScore      Float     @default(0)
  reviewCount       Int       @default(0)
  availability      Availability @default(Available)
  location          String
  specializations   String[]
  appointments      Appointment[]
  orders            Order[]
  campaigns         Campaign[]
}

enum Availability { Available Busy Unavailable }

model PortfolioImage {
  id          String   @id @default(uuid())
  designerId  String
  designer    Designer @relation(fields: [designerId], references: [id])
  url         String
  category    String?
  traditional Boolean  @default(false)
  uploadedAt  DateTime @default(now())
}

model Vendor {
  id       String    @id @default(uuid())
  userId   String    @unique
  user     User      @relation(fields: [userId], references: [id])
  location String
  listings Listing[]
  orders   Order[]
}

model Listing {
  id          String   @id @default(uuid())
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  name        String
  category    ListingCategory
  description String
  price       Float
  images      ListingImage[]
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ListingCategory { Clothing Hairstyles Accessories }

model ListingImage {
  id        String   @id @default(uuid())
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id])
  url       String
}

model Marketer {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  subRole         MarketerSubRole
  portfolioFiles  MarketerFile[]
  bookingStatus   BookingStatus @default(Available)
  location        String
  bookings        Booking[]
}

enum BookingStatus { Available Booked }

model MarketerFile {
  id         String   @id @default(uuid())
  marketerId String
  marketer   Marketer @relation(fields: [marketerId], references: [id])
  url        String
  type       MediaType
}

enum MediaType { Image Video }

model Appointment {
  id         String            @id @default(uuid())
  clientId   String
  designerId String
  designer   Designer          @relation(fields: [designerId], references: [id])
  status     AppointmentStatus @default(Pending)
  date       DateTime
  location   String?
  notes      String?
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
}

enum AppointmentStatus { Pending Confirmed Attended Delivered Cancelled }

model Order {
  id             String      @id @default(uuid())
  clientId       String
  vendorId       String
  designerId     String?
  vendor         Vendor      @relation(fields: [vendorId], references: [id])
  designer       Designer?   @relation(fields: [designerId], references: [id])
  items          OrderItem[]
  total          Float
  paymentMethod  PaymentMethod
  paymentStatus  PaymentStatus @default(Pending)
  deliveryStatus DeliveryStatus @default(Pending)
  pipelineStatus PipelineStatus @default(New)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

enum PaymentMethod  { MTN_MoMo Orange_Money }
enum PaymentStatus  { Pending Paid Failed }
enum DeliveryStatus { Pending InTransit Delivered }
enum PipelineStatus { New InProgress Fitting Ready Delivered }

model OrderItem {
  id        String @id @default(uuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id])
  listingId String
  name      String
  quantity  Int
  unitPrice Float
}

model Booking {
  id              String        @id @default(uuid())
  designerId      String
  marketerId      String
  marketer        Marketer      @relation(fields: [marketerId], references: [id])
  description     String
  proposedStart   DateTime
  proposedEnd     DateTime
  status          BookingStatus2 @default(Pending)
  createdAt       DateTime      @default(now())
}

enum BookingStatus2 { Pending Confirmed Declined }

model Conversation {
  id        String    @id @default(uuid())
  clientId  String
  designerId String
  messages  Message[]
  createdAt DateTime  @default(now())
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  type           MessageType
  content        String
  deliveryStatus MessageStatus @default(Sent)
  sentAt         DateTime     @default(now())
  readAt         DateTime?
}

enum MessageType   { Text Image }
enum MessageStatus { Sent Delivered Read }

model Campaign {
  id          String   @id @default(uuid())
  designerId  String
  designer    Designer @relation(fields: [designerId], references: [id])
  title       String
  description String
  budget      Float
  images      String[]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Review {
  id         String   @id @default(uuid())
  designerId String
  clientId   String
  score      Int
  comment    String?
  createdAt  DateTime @default(now())
}
```

---

## ML Service API Specification

All endpoints require `X-API-Key: <ML_SERVICE_API_KEY>` header.

### GET /health

**Response:**

```json
{
  "status": "ok",
  "clip_loaded": true,
  "pinecone_connected": true,
  "timestamp": "2026-07-22T10:00:00Z"
}
```

### POST /api/v1/generate-embedding

**Request:** multipart/form-data `file` (image) OR JSON `{ "image_url": "https://..." }`
**Response:**

```json
{
  "embedding": [0.12, -0.03, ...],  // 512 floats
  "model": "clip-vit-b-32",
  "cached": false
}
```

### POST /api/v1/similar-search

**Request:**

```json
{
  "image_url": "https://...", // OR send file via multipart
  "top_k": 12,
  "filter": { "traditional": true } // optional Pinecone metadata filter
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "img_001",
      "score": 0.94,
      "image_url": "https://...",
      "category": "Traditional Wedding",
      "traditional": true,
      "region": "Northwest",
      "occasion": "Wedding",
      "price_range": "50000-150000"
    }
  ],
  "query_time_ms": 142
}
```

### POST /api/v1/style-chat

**Request:**

```json
{
  "message": "I need something elegant for a traditional wedding in Bafoussam",
  "conversation_id": "conv_abc123",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "extract_brief": false
}
```

**Response:**

```json
{
  "reply": "For a traditional wedding in Bafoussam...",
  "conversation_id": "conv_abc123",
  "brief": null
}
```

When `extract_brief: true` or message contains "generate brief":

```json
{
  "reply": "Here is your design brief...",
  "conversation_id": "conv_abc123",
  "brief": {
    "style": "Traditional Bamileke",
    "occasion": "Wedding",
    "color_palette": ["Royal Blue", "Gold"],
    "fabric_preference": "Toghu",
    "budget_range_xaf": "100000-300000",
    "special_requirements": "Must include headwrap"
  }
}
```

---

## Monolith → ML Proxy Routes

### /api/ml/similar-search (Next.js Route Handler)

```typescript
// app/api/ml/similar-search/route.ts
// 1. Validate file (MIME, size ≤ 10MB)
// 2. Forward to ML_SERVICE_URL/api/v1/similar-search with X-API-Key
// 3. If ML Service returns 503 or circuit is open → return 200 with fallback
// 4. Return ML Service response to client
```

### /api/ml/style-chat (Next.js Route Handler)

```typescript
// app/api/ml/style-chat/route.ts
// 1. Validate message (1–2000 chars)
// 2. Forward to ML_SERVICE_URL/api/v1/style-chat with X-API-Key
// 3. If ML Service fails → return friendly error message
// 4. Return response to client
```

---

## Circuit Breaker Pattern (Monolith Side)

```typescript
// lib/circuit-breaker.ts
// State: CLOSED | OPEN | HALF_OPEN
// CLOSED → normal operation
// After 5 consecutive failures → OPEN (reject all for 60s)
// After 60s → HALF_OPEN (allow 1 probe request)
// Probe succeeds → CLOSED; probe fails → OPEN again
```

---

## PWA Configuration

```typescript
// next.config.ts — @serwist/next
const withSerwist = createSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

// public/manifest.json
{
  "name": "NdoloStitch",
  "short_name": "NdoloStitch",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FFC107",
  "background_color": "#FFFFFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Seed Data Strategy (ML Service)

```yaml
Image Collection (200 total):
  - 50 Traditional wedding outfits (Toghu, Sanja, Kaba Ngondo)
  - 50 Modern/Office wear (Ankara, contemporary)
  - 30 Traditional hairstyles
  - 30 Modern hairstyles
  - 20 Accessories (beads, bags, headwraps)
  - 20 Designer portfolio samples

Metadata per image:
  id:          "img_001" ... "img_200"
  image_url:   Supabase Storage public URL
  category:    e.g. "Traditional Wedding"
  traditional: true | false
  region:      e.g. "Northwest", "Littoral", "Centre"
  occasion:    e.g. "Wedding", "Office", "Casual"
  price_range: e.g. "10000-50000" (XAF)

Pinecone index:
  name:       ndolostitch-fashion
  dimensions: 512
  metric:     cosine
```

---

## Environment Variables

### Monolith (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
ML_SERVICE_URL=
ML_SERVICE_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

### ML Service (.env)

```
ML_SERVICE_API_KEY=
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
PINECONE_API_KEY=
PINECONE_INDEX_NAME=ndolostitch-fashion
PINECONE_ENVIRONMENT=
CLIP_MODEL_NAME=openai/clip-vit-base-patch32
CACHE_TTL_SECONDS=3600
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60
```
