# NdoloStitch — Complete Application Documentation

- **Version:** 1.0
- **Date:** July 2026
- **Status:** Production Ready

---

## 1. Executive Summary

### 1.1 The Problem

Cameroon's fashion industry faces significant fragmentation:

- **Customers** struggle to find quality designers and authentic pieces.
- **Designers** lack tools to manage orders, appointments, and market their work.
- **The Ecosystem** (clothing, hair, accessories) operates in silos with no unified discovery platform.
- **Cultural Heritage** (Toghu, Kaba Ngondo, Sanja) needs better visibility.

### 1.2 The Solution

> **NdoloStitch** (*Ndolo* = "love" in Duala, *Stitch* = fashion connection) is a Progressive Web Application that connects customers with verified Cameroonian fashion designers, vendors, and marketers.

**Tagline:** *"Where Cameroonian Fashion Connects"*

### 1.3 Core Features

| Feature | Description | Technology |
|---|---|---|
| AI Visual Search | Upload a photo, find similar designs across all designers | CLIP + Pinecone |
| AI Style Assistant | Describe what you want in casual language, get a structured design brief | Gemini Flash |
| Designer Dashboard | Order tracking, appointment calendar, delivery management | Next.js + Supabase |
| Unified Marketplace | Clothing + Hairstyles + Accessories, Traditional + Modern | Next.js + Supabase |

---

## 2. System Architecture Overview

### 2.1 Data Flow

```
User Request → Frontend (Next.js)
       │
       ├── API Routes (Next.js) → Supabase (CRUD operations)
       │
       └── ML Service
              ├── CLIP (image embeddings)
              ├── Gemini (chat)
              └── Pinecone (vector search)
                      │
                      ▼
              Response → Back to user via Frontend
```

---

## 3. Team Structure & Responsibilities

### 3.1 Team Members

| Name | Role | Focus Area |
|---|---|---|
| Jeason Angel | Lead Software Developer | Frontend Architecture & UI Development |
| Faith Angel | Software Developer | Backend Architecture & Data Layer |
| Gabe | MLOps Engineer | ML Service Development & AI Integration |
| Deyo | DevOps Engineer | Infrastructure, Deployment & Production Readiness |

### 3.2 Key Deliverables by Role

| Role | Primary Deliverables | Timeline |
|---|---|---|
| Jeason (Frontend) | Next.js app, PWA, UI components, Zustand stores | Day 1–3 |
| Faith (Backend) | Supabase setup, Prisma schema, API routes, Auth | Day 1–3 |
| Gabe (ML) | FastAPI service, CLIP + Gemini integration, Pinecone seeding | Day 1–2 |
| Deyo (DevOps) | Vercel deployment, CI/CD, monitoring, security | Day 1–3 |

---

## 4. Frontend Technical Stack

### 4.1 Overview

The frontend is a highly interactive, component-driven Single Page Application (SPA) with server-side capabilities built on **Next.js 15**.

### 4.2 Core Framework & Libraries

| Tool / Library | Version | Context & Justification |
|---|---|---|
| `next` | ^15.1.3 | **Framework:** Core React framework. Provides SSR, SSG, and file-based routing. Version 15 supports the React 19 compiler, improving performance. |
| `react` / `react-dom` | ^19.0.0 | **UI Library:** The view layer. React 19 introduces new hooks and enhanced concurrent rendering for a smoother user experience. |
| `zustand` | ^4.5.2 | **State Management:** Lightweight global state handler. Perfect for managing user carts, theme state, and session data without complex boilerplate. |
| `@tanstack/react-query` | ^5.56.2 | **Data Fetching & Caching:** Server-state manager. Provides robust caching, background refetching, and optimistic updates. |
| `axios` | ^1.7.7 | **HTTP Client:** Cleaner API than native `fetch`, handles request/response interception (crucial for auth tokens) and provides better error handling. |
| `socket.io-client` | ^4.8.0 | **Real-time Communication:** WebSocket client. Enables live chat, instant inventory updates, or live order tracking. |
| `react-hook-form` | ^7.53.0 | **Form Management:** Reduces boilerplate, handles complex validation, and integrates seamlessly with Zod for type-safe schema validation. |
| `zod` | ^3.23.8 | **Validation:** Schema declaration library. Validates form inputs and API responses, ensuring type safety between UI and backend. |
| `next-intl` | ^3.19.4 | **Internationalization (i18n):** Translation library. Allows the app to support multiple languages (e.g., English, French). |

### 4.3 UI & Styling Stack

| Tool / Library | Version | Context & Justification |
|---|---|---|
| `tailwindcss` | ^3.4.16 | **CSS Framework:** Utility-first CSS framework for rapid UI development with consistent design tokens. |
| `framer-motion` | ^11.9.0 | **Animation:** Production-ready motion library. Used for page transitions, micro-interactions, and complex layout animations. |
| `lucide-react` | ^0.447.0 | **Icons:** Lightweight, consistent SVG icon set that integrates effortlessly with Tailwind CSS. |
| `react-day-picker` | ^9.1.3 | **Date Picker:** Accessible and customizable date selection for booking appointments and date-range filters. |
| `date-fns` | ^3.6.0 | **Date Utility:** Lightweight alternative to Moment.js. Handles timezone conversions and formatting for orders and bookings. |

### 4.4 Utility & Accessibility Stack

| Tool / Library | Version | Context & Justification |
|---|---|---|
| `class-variance-authority` | ^0.7.0 | **UI Variants:** Manages component variants (e.g., Button with `primary`, `secondary`, `danger` styles). |
| `clsx` | ^2.1.1 | **Utility:** Conditional class joining — toggles Tailwind classes based on component state. |
| `tailwind-merge` | ^2.5.2 | **Utility:** Prevents class conflicts when combining utility classes. |
| `@radix-ui/react-dialog` | ^1.x.x | **Headless UI:** Accessible modal dialogs. |
| `@radix-ui/react-dropdown-menu` | ^1.x.x | **Headless UI:** Accessible dropdown menus for navigation, user profiles, and filters. |
| `@radix-ui/react-tabs` | ^1.x.x | **Headless UI:** Accessible tabbed interfaces for product categories, designer portfolios, and dashboard navigation. |
| `@radix-ui/react-avatar` | ^1.x.x | **Headless UI:** Accessible avatar components for user profiles and designer thumbnails. |

---

## 5. Backend Technical Stack

### 5.1 Overview

The backend is built around **Next.js API routes** (Full Stack capability) and heavily features Node.js server-side tooling for database interaction, infrastructure, and third-party integrations.

### 5.2 Core Backend Libraries

| Tool / Library | Version | Context & Justification |
|---|---|---|
| `@prisma/client` / `prisma` | ^5.22.0 | **ORM:** Type-safe layer between Node.js and PostgreSQL. Handles migrations, model definitions, and provides autocompletion for DB queries. |
| `@supabase/ssr` / `@supabase/supabase-js` | ^2.46.2 | **Authentication & Storage:** Backend-as-a-Service. Provides seamless Auth flow (signup, login, magic links, OAuth) and cloud storage for images. |
| `@upstash/redis` / `@upstash/ratelimit` | ^1.34.3 / ^2.0.4 | **Cache & Rate Limiting:** Serverless Redis. Caches frequent DB queries and protects API endpoints from DDoS/spam. |
| `bcryptjs` | ^2.4.3 | **Hashing Library:** Securely hashes user passwords before storing them in the database. |
| `ingest` | ^3.27.3 | **Data Ingestion:** Handles large data streams such as bulk inventory CSVs or customer order exports. |
| `jose` | ^5.9.6 | **JWT Utilities:** Decodes, verifies, and creates JWTs. Essential for verifying session tokens. |

### 5.3 Integration & Services Stack

| Tool / Library | Version | Context & Justification |
|---|---|---|
| `resend` | ^4.0.1 | **Email Service:** Sends transactional emails — order confirmations, password resets, abandoned cart notifications. |
| `sharp` | ^0.33.5 | **Image Processing:** High-performance library to resize, compress, and convert product images to WebP format. |
| `stripe` | ^22.3.2 | **Payment Gateway:** Handles payment intents, Checkout Sessions, and webhook verification for PCI-compliant payments. |
| `twilio` | ^5.13.1 | **Communication:** SMS & Voice API. Sends shipping updates, order pickup notifications, or 2FA codes. |

### 5.4 Development & Quality Stack

| Tool / Library | Version | Context & Justification |
|---|---|---|
| `uuid` | ^14.0.1 | **Identifier Generation:** Generates cryptographically secure UUIDs for DB primary keys, order reference numbers, etc. |
| `zod` | ^3.23.8 | **Validation:** Schema declaration. Validates `req.body` of incoming API requests to prevent malformed data. |
| `@types/node`, `@types/react`, `@types/bcryptjs` | — | **TypeScript Definitions:** Provides autocompletion and type safety. |
| `eslint` / `eslint-config-next` | ^15.0.4 | **Linting:** Enforces coding standards, catches syntax errors and anti-patterns. |
| `tailwindcss` / `postcss` / `autoprefixer` | ^3.4.16 | **Styling Pipeline:** Tailwind + PostCSS + Autoprefixer for cross-browser CSS compatibility. |
| `ts-node` | ^10.9.2 | **Execution:** Runs TypeScript scripts directly without compilation — useful for seed and migration scripts. |

---

## 6. ML / GenAI Service Stack

### 6.1 Overview

The ML/GenAI service is a hybrid **GenAI & Vector Search microservice** built specifically for fashion intelligence. It uses a Python-based **FastAPI** service with integrated AI models.

### 6.2 Core ML Components

| Tool / Library | Implementation Stack | Context & Justification |
|---|---|---|
| Google AI Studio (Gemini 1.5 Flash) | `google-generativeai` (Python) | **LLM & Vision Model:** Multimodal, cost-effective (free tier), and fast. Understands fashion images and generates personalized outfit descriptions, styling tips, and product metadata. |
| Pinecone | `pinecone` (Python) | **Vector Database:** Stores high-dimensional embeddings of every fashion item. Computes cosine similarity in milliseconds to find visually or semantically matching products. |
| CLIP (Contrastive Language-Image Pre-training) | `transformers` + `torch` (Python) | **Embedding Model:** Converts product images into 512-dimension vector embeddings before storing in Pinecone. Model: `openai/clip-vit-base-patch32`. |
| FastAPI | `fastapi` (Python) | **Inference API:** Service interface between Next.js Backend and ML models. Exposes endpoints like `/api/v1/similar-search` and `/api/v1/style-chat`. |

### 6.3 ML Model Specifications

#### Vision Model — CLIP

| Component | Value |
|---|---|
| Model | `openai/clip-vit-base-patch32` |
| Embedding Dimension | 512 |
| Output | Image embeddings |

#### LLM Model — Gemini

| Component | Value |
|---|---|
| Model | `gemini-flash-latest` |
| Provider | Google AI Studio (Free Tier) |
| Rate Limit | 15 requests/minute, 1,500/day |

#### Vector Database — Pinecone

| Component | Value |
|---|---|
| Index Name | `ndolostitch-fashion` |
| Metric | Cosine |
| Total Vectors | 1,262 seeded images |

---

## 7. API Specification

### 7.1 Authentication

| Method | Header | Description |
|---|---|---|
| API Key | `X-API-Key: <key>` | Required for all ML service endpoints |
| Supabase Auth | JWT Token | Phone OTP authentication |

### 7.2 ML Service Endpoints

#### `GET /health`

**Purpose:** Service health check

**Response:**

```json
{
    "status": "healthy",
    "components": {
        "clip": "loaded",
        "pinecone": "connected",
        "gemini": {
            "model": "gemini-flash-latest",
            "sdk": "google-genai (new)",
            "status": "available"
        }
    }
}
```

---

#### `POST /api/v1/similar-search`

**Purpose:** Find visually similar designs

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes\* | Image file (JPG/PNG) |
| `text` | String | Yes\* | Text description |
| `top_k` | Integer | No | Results count (default: 10) |

> \*Must provide either `file` or `text`.

**Response:**

```json
{
    "results": [
        {
            "id": "image_001",
            "score": 0.89,
            "image_url": "",
            "category": "clothing",
            "traditional": true,
            "region": "Littoral",
            "occasion": "wedding",
            "price_range": "mid-range"
        }
    ],
    "query_time_ms": 123
}
```

---

#### `POST /api/v1/style-chat`

**Purpose:** Chat with AI fashion assistant

**Request:** `application/json`

```json
{
    "message": "I need a traditional Toghu dress for my wedding",
    "conversation_id": "test_001",
    "history": [
        { "role": "user", "content": "..." }
    ],
    "extract_brief": true
}
```

**Response:**

```json
{
    "reply": "For your wedding, a traditional Toghu dress...",
    "conversation_id": "test_001",
    "brief": {
        "occasion": "wedding",
        "style": "traditional",
        "colors": "black, gold, red",
        "fabrics": "velvet, silk",
        "accessories": "coral beads, headpiece",
        "budget": null
    }
}
```

### 7.3 Core Application Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/signup` | POST | Phone OTP signup |
| `/api/auth/verify` | POST | Verify OTP |
| `/api/designers` | GET | List designers with filters |
| `/api/designers/:id` | GET | Designer profile |
| `/api/bookings` | POST | Create booking |
| `/api/orders` | GET | User orders |

---

## 8. Database Design

### 8.1 Supabase PostgreSQL Schema

#### Table: `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'customer', -- customer, designer, admin
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `designers`

```sql
CREATE TABLE designers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    business_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),              -- clothing, hair, accessories
    is_traditional BOOLEAN DEFAULT FALSE,
    region VARCHAR(50),
    rating DECIMAL(3,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `bookings`

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id),
    designer_id UUID REFERENCES designers(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `orders`

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id),
    designer_id UUID REFERENCES designers(id),
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.2 Pinecone Vector Index

| Property | Value |
|---|---|
| Index Name | `ndolostitch-fashion` |
| Dimension | 512 (CLIP ViT-B/32) |
| Metric | Cosine |
| Vectors | 1,262 seeded images |

**Vector Metadata Structure:**

```json
{
    "id": "image_001",
    "metadata": {
        "category": "clothing",
        "traditional": true,
        "region": "Littoral",
        "occasion": "wedding",
        "price_range": "mid-range"
    }
}
```

---

## 9. Deployment & DevOps

### 9.1 Deployment Platforms

| Component | Platform | Tier |
|---|---|---|
| Frontend + Backend | Vercel | Pro |
| ML Service | Hugging Face Spaces | Free |
| Database | Supabase | Free Tier |
| Vector Database | Pinecone | Free Tier |
| Caching | Upstash Redis | Free Tier |

### 9.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
      - name: Deploy ML Service
        run: huggingface-cli upload ml-service
```

### 9.3 Environment Variables

#### Next.js (`.env`)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ML_SERVICE_API_KEY=ndolostitch2026
```

#### ML Service (`.env`)

```env
ML_SERVICE_API_KEY=ndolostitch2026
GOOGLE_API_KEY=AIza...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=ndolostitch-fashion
PINECONE_DIMENSION=512
PINECONE_METRIC=cosine
ALLOWED_ORIGINS=["http://localhost:3000", "https://ndolostitch.vercel.app"]
```

### 9.4 Docker Configuration

```dockerfile
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=7860
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

## 10. Local Development Setup

### 10.1 Prerequisites

| Software | Version |
|---|---|
| Node.js | 22+ |
| Python | 3.12+ |
| Git | Latest |

### 10.2 Installation Steps

#### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/ndolostitch.git
cd ndolostitch
```

#### Step 2: Setup Next.js Application

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

#### Step 3: Setup ML Service

```bash
# Navigate to ML service folder
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate          # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run ML service
python -m uvicorn app.main:app --reload --port 8000
```

### 10.3 Required API Keys

| Service | Get From | Purpose |
|---|---|---|
| Gemini API | Google AI Studio | Style assistant |
| Pinecone | Pinecone Console | Vector search |
| Supabase | Supabase Dashboard | Database + Auth |
| Vercel | Vercel Dashboard | Deployment |

---

## 11. Testing Strategy

### 11.1 Testing Levels

| Level | Tools | Coverage Target |
|---|---|---|
| Unit Tests | Jest (JS), pytest (Python) | 80%+ |
| Integration Tests | Supertest, pytest | API endpoints |
| End-to-End | Playwright | Key user flows |
| Performance | Lighthouse, Locust | >90 Lighthouse |

### 11.2 ML Service Tests

```bash
# Test endpoints
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/v1/similar-search -F "file=@test.jpg"
curl -X POST http://localhost:8000/api/v1/style-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

---

## 12. Known Issues & Troubleshooting

| Problem | Solution |
|---|---|
| 401 Unauthorized | Ensure `X-API-Key` header matches `ML_SERVICE_API_KEY` |
| Invalid API Key | Check `ML_SERVICE_API_KEY` in `.env` matches request |
| Pinecone connection failed | Verify `PINECONE_API_KEY` and index name |
| Gemini quota exhausted | Wait 24 hours or enable billing |
| Brief returns `null` | Set `extract_brief: true` in request |
| 404 on model endpoints | Use correct model name: `gemini-flash-latest` |
| CLIP model download slow | Set `HF_TOKEN` for faster downloads |
| CORS errors | Add origin to `ALLOWED_ORIGINS` in `.env` |

---

## 13. Contribution Guide

### 13.1 Branch Naming Convention

| Type | Format | Example |
|---|---|---|
| Feature | `feature/description` | `feature/visual-search` |
| Fix | `fix/description` | `fix/brief-extraction` |
| Docs | `docs/description` | `docs/api-documentation` |
| Chore | `chore/description` | `chore/update-deps` |

### 13.2 Pull Request Process

1. Fork the repository.
2. Create a feature branch.
3. Commit changes with clear messages.
4. Push to your fork.
5. Create a Pull Request to `main`.
6. Request review from team members.
7. Address feedback.
8. Merge when approved.

### 13.3 Code Style

| Language | Tool | Command |
|---|---|---|
| TypeScript / JS | ESLint + Prettier | `npm run lint` |
| Python | Black + isort | `black . && isort .` |

---

## 14. Future Improvements

### 14.1 Short Term (Next Sprint)

- [ ] Expand seed dataset to 10,000+ images
- [ ] Implement user ratings and reviews
- [ ] Add push notifications
- [ ] Enhance brief extraction with more fields
- [ ] Add image generation (DALL-E / Midjourney)

### 14.2 Long Term (Roadmap)

- [ ] Implement recommendation engine (collaborative filtering)
- [ ] Add virtual try-on (AR/VR)
- [ ] Integrate payment processing
- [ ] Multi-language support (French, English, Pidgin)
- [ ] Mobile app (React Native)
- [ ] Designer analytics dashboard
- [ ] Marketing automation tools

---

## 15. Resources & Links

| Resource | Link |
|---|---|
| Next.js | https://nextjs.org |
| Supabase | https://supabase.com |
| Pinecone | https://pinecone.io |
| Gemini API | https://ai.google.dev/gemini-api |
| Hugging Face | https://huggingface.co |
| Vercel | https://vercel.com |
| Project Repo | https://github.com/your-org/ndolostitch |

---

## 16. License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.

---

> **Documentation Version:** 1.0  
> **Last Updated:** July 2026  
> **Maintainer:** NdoloStitch Team  
> **"Where Cameroonian Fashion Connects"** 🇨🇲👗

