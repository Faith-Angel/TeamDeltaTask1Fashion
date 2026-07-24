# Requirements Document — NdoloStitch

## Introduction

NdoloStitch ("Where Cameroonian Fashion Connects") is a Progressive Web App built with **Next.js 15** that connects Clients, Designers, Vendors, and Marketers inside Cameroon's fashion ecosystem. It features AI-powered visual search (CLIP), a conversational AI style assistant (GPT-4o), a designer marketplace, an appointment and order management system, and a unified discovery feed for clothing, hairstyles, and accessories (traditional and modern).

The application is a **monolith-first** architecture: the Next.js 15 app handles both frontend and backend API routes (Server Actions + Route Handlers). A **separate FastAPI ML service** provides CLIP-based visual search and GPT-4o style chat; all other logic lives in the monolith.

---

## Glossary

- **App**: The NdoloStitch Next.js 15 PWA.
- **ML Service**: The standalone FastAPI Python service providing CLIP visual search and GPT-4o style chat.
- **Client**: A registered user who browses the feed, discovers designers/vendors, places orders, and uses AI features.
- **Designer**: A registered user who manages a portfolio, handles appointments, manages order pipelines, and creates marketing campaigns.
- **Vendor**: A registered user who manages a product/service catalog and fulfills orders.
- **Marketer**: A registered user (Model or Content Creator) who accepts booking requests from Designers.
- **Inspiration Feed**: The masonry-grid scrollable feed of outfit inspiration images.
- **Visual Search**: Upload an image → find visually similar designs using CLIP embeddings stored in Pinecone.
- **Style Assistant**: A GPT-4o conversational interface where a user describes what they want in natural language and receives a structured design brief.
- **Designer Dashboard**: The Designer's control panel showing stats, order pipeline (Kanban), appointment calendar, and campaign tools.
- **Marketplace**: The unified catalog of clothing, hairstyles, and accessories across all Vendors.
- **PWA**: Progressive Web App — installable on any device, works offline for cached content.

---

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new user, I want to register with my phone number and verify with an OTP, so that I get a dashboard tailored to my role.

#### Acceptance Criteria

1. THE App SHALL present a registration form collecting: full name (1–100 characters), phone number in E.164 format (+237XXXXXXXXX), geographic location (city or region, 1–100 characters), and role (Client, Designer, Vendor, Marketer).
2. WHEN a user selects the Marketer role, THE App SHALL present a sub-role selection (Model or Content_Creator) before the form can be submitted.
3. WHEN a user submits the registration form with invalid or empty required fields, THE App SHALL display an inline error on each invalid field and SHALL NOT create an account.
4. IF a phone number is already registered, THEN THE App SHALL display an error on the phone field and SHALL NOT create a duplicate account.
5. WHEN registration is submitted with valid fields, THE App SHALL send an OTP to the provided phone number and navigate the user to an OTP verification screen.
6. WHEN a user enters the correct OTP within 5 minutes, THE App SHALL create the account and redirect to the role-specific dashboard within 3 seconds.
7. THE App SHALL allow a registered user to log in using phone number + OTP (Supabase Phone Auth).
8. WHEN a user logs in successfully, THE App SHALL present the role-specific dashboard within 3 seconds.
9. IF a login attempt is made with an unrecognized phone number, THE App SHALL display a generic error and allow retry.
10. WHEN a user has an active session, THE App SHALL navigate directly to their role-specific dashboard on subsequent visits without requiring re-authentication.
11. THE App SHALL support sign-out, which clears the Supabase session and redirects to the home page.

---

### Requirement 2: Role-Specific Dashboards

**User Story:** As a registered user, I want to see a dashboard specific to my role, so that I can immediately access the tools relevant to me.

#### Acceptance Criteria

1. WHEN a Client logs in, THE Dashboard SHALL display entry points to the Inspiration Feed, Designer Directory, Marketplace, Visual Search, and Style Assistant.
2. WHEN a Designer logs in, THE Dashboard SHALL display stats cards (total orders, pending appointments, revenue), an order pipeline Kanban board, an appointment calendar, and a marketing campaign section.
3. WHEN a Vendor logs in, THE Dashboard SHALL display catalog management, active orders, and delivery tracking.
4. WHEN a Marketer logs in, THE Dashboard SHALL display their portfolio, pending booking requests count, and booking history.
5. IF dashboard data fails to load within 5 seconds, THE App SHALL display an error banner with a Retry button and retain the last successfully loaded state where available.
6. THE App SHALL apply an Afrocentric color palette (Kente Gold #FFC107, Sahara Sunset #FF6F00, Congo Royale #4A148C, Bamileke Earth #5D4037, Savanna Bloom #558B2F) as the primary visual theme.

---

### Requirement 3: Inspiration Feed

**User Story:** As a Client, I want to scroll through a curated feed of Cameroonian fashion inspirations, so that I can discover designs.

#### Acceptance Criteria

1. THE Inspiration Feed SHALL display a masonry-grid scrollable collection of outfit images including traditional (Toghu, Sanja, Kaba Ngondo, Ankara) and modern styles.
2. THE Feed SHALL support two category tabs: "Traditional" and "Non-Traditional (Modern)".
3. THE Feed SHALL support infinite scrolling, loading the next batch of at least 10 items as the user approaches the end; WHEN no more items are available, THE Feed SHALL display an end-of-feed indicator.
4. WHEN a user clicks an inspiration image, THE App SHALL display a detail view with the full image, style tags, designer attribution (if any), and action buttons: "Find Similar" (Visual Search) and "Style This" (Style Assistant).
5. THE Feed SHALL be accessible in read-only mode to unauthenticated visitors (guest mode).

---

### Requirement 4: Visual Search (AI)

**User Story:** As a Client, I want to upload a photo and find visually similar designs, so that I can discover designers who can make something like it.

#### Acceptance Criteria

1. THE App SHALL provide a Visual Search component that accepts image uploads in JPEG, PNG, or WEBP format, each no larger than 10 MB.
2. WHEN a user uploads a valid image, THE App SHALL send the image to the ML Service (`/api/v1/similar-search`), which SHALL return a ranked list of similar designs within 5 seconds under normal load.
3. THE ML Service SHALL use CLIP ViT-B/32 to generate a 512-dimensional embedding from the uploaded image and query Pinecone to retrieve the top-k (default 12) most similar results.
4. THE results grid SHALL display each result with its image, category tag, designer name, and a "View Designer" link.
5. IF the ML Service is unavailable, THE App SHALL display a graceful degradation message and SHALL NOT crash.
6. IF a user uploads a file in an unsupported format or exceeding 10 MB, THE App SHALL display a validation error and SHALL NOT submit the request.
7. THE ML Service SHALL maintain a Pinecone index pre-seeded with at least 200 Cameroonian fashion images with metadata: category, traditional (boolean), region, occasion, price_range.

---

### Requirement 5: Style Assistant (AI)

**User Story:** As a Client, I want to describe what I want in casual language and receive a structured design brief, so that I can share it with a designer.

#### Acceptance Criteria

1. THE App SHALL provide a Style Assistant chat interface powered by GPT-4o.
2. WHEN a user sends a message (1–2000 characters), THE ML Service SHALL respond as a knowledgeable Cameroonian fashion consultant within 10 seconds.
3. THE ML Service SHALL maintain conversation history within a session (up to 20 turns) so that follow-up questions have context.
4. WHEN the user sends the trigger phrase "generate brief" or clicks the "Generate Brief" button, THE ML Service SHALL extract a structured JSON brief from the conversation containing: style, occasion, color_palette, fabric_preference, budget_range_xaf, and special_requirements.
5. THE structured brief SHALL be displayable as a formatted card that the user can copy or send directly to a Designer via the messaging system.
6. IF the Gemini API is unavailable or exceeds the 10-second timeout, THE App SHALL display an error and offer a Retry button.
7. THE Style Assistant SHALL be system-prompted to focus exclusively on Cameroonian and African fashion; responses outside this domain SHALL be politely redirected.

---

### Requirement 6: Designer Discovery

**User Story:** As a Client, I want to browse and search for Designers by location, category, and rating, so that I can find the right designer.

#### Acceptance Criteria

1. THE Designer Directory SHALL display cards showing: name, location, rating (0.0–5.0), specialization tags, and a portfolio thumbnail.
2. THE Directory SHALL support filters: category (Traditional/Modern/Accessories/Hairstyles), region, price range, and rating.
3. WHEN a Client applies filters, THE Directory SHALL return matching results within 3 seconds.
4. WHEN a Client searches by name or location (1–100 characters), THE Directory SHALL return matching results within 3 seconds.
5. WHEN a Client clicks a Designer card, THE App SHALL navigate to the Designer's profile page.
6. THE Designer profile SHALL display: up to 20 portfolio images, rating, location, availability ("Available", "Busy", "Unavailable"), specialization tags, reviews, and a "Book Appointment" CTA.
7. THE Designer profile SHALL include a map view (Leaflet) showing the designer's approximate location.
8. WHEN a Client clicks "Book Appointment", THE App SHALL open a booking flow with a date picker (shadcn/ui calendar), location field, and details form.

---

### Requirement 7: Designer Dashboard and Order Management

**User Story:** As a Designer, I want a dashboard that shows my business stats and lets me manage my order pipeline and appointments, so that I can stay organized.

#### Acceptance Criteria

1. THE Designer Dashboard SHALL display stats cards: total completed orders, pending appointments count, monthly revenue (XAF), and designer ranking score.
2. THE Designer Dashboard SHALL include an order pipeline Kanban board with columns: "New", "In Progress", "Fitting", "Ready", "Delivered".
3. WHEN a Designer drags an order card to a different column, THE App SHALL update the order status via a Server Action and reflect the change within 2 seconds.
4. WHEN an order status changes, THE App SHALL notify the relevant Client via Supabase Realtime.
5. THE Designer Dashboard SHALL include an appointment calendar (shadcn/ui calendar) showing all pending and confirmed appointments.
6. WHEN a Designer clicks an appointment, THE App SHALL show the appointment details and actions: "Confirm", "Mark Attended", "Mark Delivered", "Cancel".
7. THE Designer Dashboard SHALL include a marketing campaign section where a Designer can create a campaign listing (title, description, budget, images) to appear in the campaign marketplace.

---

### Requirement 8: Marketplace and Purchasing

**User Story:** As a Client, I want to browse vendor catalogs and purchase fashion items with delivery, so that I can shop without meeting vendors in person.

#### Acceptance Criteria

1. THE Marketplace SHALL display catalog listings with filters: category (Clothing, Hairstyles, Accessories), region, price range.
2. WHEN a Client clicks a listing, THE App SHALL display the item detail: name, description, price (XAF), up to 10 images, vendor info, and an "Add to Cart" button.
3. WHEN a Client clicks "Add to Cart" on an available item, THE App SHALL add the item and update the cart count within 1 second.
4. IF a Client attempts to add an out-of-stock item, THE App SHALL display an "Item unavailable" message and SHALL NOT add it.
5. WHEN a Client proceeds to checkout, THE App SHALL display an order summary and prompt for payment method (MTN Mobile Money or Orange Money).
6. WHEN a Client confirms an order, THE App SHALL process the payment, create an order record, notify the Vendor, and display a confirmation with order reference and estimated delivery date.
7. IF payment fails, THE App SHALL display the failure reason, preserve the cart, and allow retry or payment method change.
8. THE Vendor SHALL be able to manage their catalog: create listings (name 1–100 chars, category, description 1–1000 chars, price 0.01–999,999.99 XAF, 1–10 images each ≤5 MB), update, and mark items as out of stock.

---

### Requirement 9: Real-Time Chat and Messaging

**User Story:** As a Client or Designer, I want to send and receive messages in real time, so that we can coordinate on designs and appointments.

#### Acceptance Criteria

1. THE App SHALL allow any Client to initiate a conversation with any Designer visible in the Designer Directory.
2. WHEN a message is sent, THE App SHALL deliver it to the recipient via Supabase Realtime within 3 seconds under normal network conditions.
3. THE Chat SHALL support text messages (max 2000 characters) and image attachments (max 10 MB each).
4. WHEN a user receives a new message while the App is in the background, THE App SHALL display a browser push notification (Web Push API) with the sender's name and a preview of up to 100 characters.
5. THE Chat SHALL display read receipts.
6. THE Chat SHALL persist all conversation history accessible to both parties.

---

### Requirement 10: Notifications

**User Story:** As a user, I want to receive timely notifications about activity relevant to my role, so that I can respond promptly.

#### Acceptance Criteria

1. THE App SHALL deliver in-app toast notifications within 3 seconds of the triggering event when the App is open.
2. THE App SHALL deliver browser push notifications (Web Push) when the App is in the background, within 30 seconds of the triggering event.
3. THE App SHALL send notifications for: new appointment requests (to Designer), appointment status updates (to Client), new orders (to Vendor), delivery status updates (to Client), new messages (to recipient).
4. WHEN a user clicks a notification, THE App SHALL navigate to the relevant page within 2 seconds.

---

### Requirement 11: PWA and Offline Support

**User Story:** As a user, I want to install the app on my device and use cached content offline, so that I can access key features even without internet.

#### Acceptance Criteria

1. THE App SHALL be installable as a PWA on mobile and desktop via a browser install prompt.
2. THE App manifest SHALL include: app name "NdoloStitch", short_name "NdoloStitch", Afrocentric theme color, icons in 192×192 and 512×512 px.
3. THE Service Worker SHALL cache: the home page shell, the inspiration feed (last loaded batch), the user's own profile, and all static assets.
4. WHEN the user is offline, THE App SHALL display cached content and a "You're offline" banner for any content that cannot be loaded.
5. WHEN connectivity is restored, THE App SHALL sync any pending actions (e.g., unsent messages) and remove the offline banner.
6. THE App SHALL achieve a Lighthouse PWA score of 100 and a Performance score ≥ 90.

---

### Requirement 12: ML Service Infrastructure (MLOps — Gabe's Task)

**User Story:** As the team, we want a production-ready ML service that the monolith can call, so that AI features are isolated, independently deployable, and resilient.

#### Acceptance Criteria

1. THE ML Service SHALL be a FastAPI application (Python 3.12) exposing the following endpoints:
   - `GET  /health` — returns service status, model load status, Pinecone connection status
   - `POST /api/v1/generate-embedding` — accepts an image (URL or file upload) and returns a 512-dim CLIP embedding
   - `POST /api/v1/similar-search` — accepts an image, generates embedding, queries Pinecone, returns top-k results with metadata
   - `POST /api/v1/style-chat` — accepts a message and conversation history, returns Gemini Flash response and optionally a structured brief
2. ALL ML Service endpoints SHALL require a shared-secret API key passed in the `X-API-Key` header; requests without a valid key SHALL receive HTTP 401.
3. THE ML Service SHALL load the CLIP ViT-B/32 model at startup; if the model fails to load, THE Service SHALL log the error and return 503 on embedding endpoints.
4. THE ML Service SHALL connect to Pinecone at startup using environment variables `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`; if the connection fails, THE Service SHALL log the error and return 503 on search endpoints.
5. THE ML Service SHALL implement a circuit-breaker pattern: after 5 consecutive failures on any endpoint, THE Service SHALL return 503 with `{"detail": "Circuit open"}` for 60 seconds before retrying.
6. WHEN the ML Service returns an error, THE monolith proxy routes (`/api/ml/similar-search`, `/api/ml/style-chat`) SHALL return a graceful fallback response rather than propagating the raw error to the client.
7. THE ML Service SHALL be fully containerized with a `Dockerfile` (multi-stage build) and orchestrated locally with `docker-compose.yml`.
8. THE ML Service SHALL expose Prometheus-compatible metrics at `/metrics`: request count, request latency (p50/p95/p99), error rate per endpoint.
9. THE seed script SHALL generate CLIP embeddings for 200 Cameroonian fashion images and upsert them into Pinecone with metadata: `{ id, image_url, category, traditional, region, occasion, price_range }`.
10. THE ML Service SHALL implement response caching (in-memory LRU with a 1-hour TTL) for identical image embedding requests to avoid redundant CLIP inference.

---

### Requirement 13: DevOps and Deployment

**User Story:** As the team, we want a fully automated CI/CD pipeline so that every push is validated and production deployments are safe.

#### Acceptance Criteria

1. THE monolith SHALL be deployed to Vercel with preview deployments for every pull request.
2. THE ML Service SHALL be deployed to Railway or Render with a Docker-based deployment.
3. A GitHub Actions CI pipeline SHALL run on every pull request: lint, TypeScript type-check, build, and test.
4. ALL environment secrets (Supabase URL/key, Pinecone API key, OpenAI API key, ML service URL, ML API key) SHALL be stored in Vercel/Railway environment variables and SHALL NOT be committed to the repository.
5. THE Vercel deployment SHALL achieve Lighthouse scores ≥ 90 for Performance, Accessibility, Best Practices, and SEO.
