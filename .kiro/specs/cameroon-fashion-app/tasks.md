# Implementation Plan: Cameroon Fashion App

## Overview

Implement a cross-platform React Native mobile application for Cameroon's fashion ecosystem. The app connects four user roles (Client, Designer, Vendor, Marketer) with an Afrocentric UI, bilingual EN/FR support, local payments (MTN MoMo + Orange Money), real-time chat via Socket.IO, and an AI-powered outfit generator. The backend is NestJS with PostgreSQL, Redis (BullMQ), and AWS S3.

Implementation proceeds in waves: project foundation → backend modules → React Native screens and stores → integration and wiring → property-based and unit tests.

---

## Tasks

- [ ] 1. Project scaffold and shared foundation
  - [ ] 1.1 Initialize React Native (Expo) project with TypeScript and install all dependencies
    - `npx create-expo-app cameroon-fashion-app --template expo-template-blank-typescript`
    - Install: `react-navigation/native`, `react-navigation/bottom-tabs`, `react-navigation/stack`, `zustand`, `axios`, `socket.io-client`, `expo-notifications`, `expo-image`, `@shopify/flash-list`, `react-i18next`, `expo-localization`, `expo-secure-store`, `react-hook-form`, `zod`, `expo-image-picker`, `expo-video`, `fast-check`
    - Install dev: `jest`, `@testing-library/react-native`, `@types/react-native`
    - _Requirements: 12.1, 12.2, 12.7, 12.8_

  - [ ] 1.2 Initialize NestJS backend project with TypeScript and install all dependencies
    - `nest new cameroon-fashion-backend`
    - Install: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `class-validator`, `class-transformer`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `@nestjs/bull`, `bullmq`, `ioredis`, `aws-sdk`, `axios`, `helmet`, `@nestjs/throttler`
    - Install dev: `jest`, `@nestjs/testing`, `supertest`, `nock`
    - _Requirements: All backend requirements_

  - [ ] 1.3 Define shared TypeScript data model interfaces and Zod validation schemas
    - Create `src/types/models.ts` with interfaces: `User`, `Designer`, `PortfolioImage`, `Vendor`, `Listing`, `ListingImage`, `Marketer`, `MarketerFile`, `Order`, `OrderItem`, `Appointment`, `Booking`, `Message`, `Conversation`, `Notification`, `Review`
    - Create `src/validation/schemas.ts` with Zod schemas for registration, login, listing creation, message, booking, outfit prompt
    - _Requirements: 1.1, 1.2, 5.1, 6.8, 7.1, 10.4_

  - [ ] 1.4 Set up Afrocentric theme tokens and i18n infrastructure
    - Create `src/theme/colors.ts` with palette: Kente Gold `#FFC107`, Sahara Sunset `#FF6F00`, Congo Royale `#4A148C`, Bamileke Earth `#5D4037`, Savanna Bloom `#558B2F`
    - Create `src/theme/typography.ts` and `src/theme/spacing.ts` (4-pt grid)
    - Create `src/i18n/en.json` and `src/i18n/fr.json` with all string keys (labels, errors, placeholders, button text)
    - Create `src/i18n/i18n.ts` with `react-i18next` + `expo-localization` configuration; default to device language if EN/FR, else EN
    - _Requirements: 12.1, 12.3, 12.6_

  - [ ]* 1.5 Write property test for translation completeness (Property 29) and language defaulting (Property 30)
    - **Property 29: Translation completeness for all string keys** — for any key in `en.json`, a non-empty `fr.json` value exists, and vice versa
    - **Property 30: Language defaulting logic correctness** — for any device locale string, the app selects EN or FR if matched, else defaults to EN
    - **Validates: Requirements 12.3, 12.6**
    - Tag: `// Feature: cameroon-fashion-app, Property 29: Translation completeness` and `// Feature: cameroon-fashion-app, Property 30: Language defaulting`

- [ ] 2. Backend: Authentication module
  - [ ] 2.1 Implement NestJS Auth module — registration, login, JWT, account lockout
    - Create `AuthModule` with `AuthController`, `AuthService`, `UsersRepository` (TypeORM)
    - `POST /auth/register`: validate fields (fullName 1–100, phone E.164 `+237XXXXXXXXX`, location 1–100, role enum, marketerSubRole when role=Marketer); hash password with bcrypt; reject duplicate phone with 409
    - `POST /auth/login`: verify phone + password or PIN; on 5th failed attempt set `lockedUntil = now+15min`, return HTTP 423 with `lockedUntil`; on success return `{ accessToken (15min JWT), refreshToken (7d JWT), user }`
    - `POST /auth/refresh`: validate refresh token, issue new access token
    - `POST /auth/logout`: revoke refresh token in Redis
    - Store `failedLoginAttempts` and `lockedUntil` per user in PostgreSQL
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 2.2 Write property test for registration field validation (Property 1)
    - **Property 1: Registration field validation — valid inputs accepted, invalid inputs rejected**
    - Generate random combinations of fullName, phone, location, role using fast-check arbitraries
    - Assert accepted iff all constraints satisfied; rejected with inline error otherwise
    - **Validates: Requirements 1.1, 1.3**
    - Tag: `// Feature: cameroon-fashion-app, Property 1: Registration field validation`

  - [ ]* 2.3 Write property test for duplicate phone rejection (Property 2) and invalid credentials (Property 3)
    - **Property 2: Duplicate phone number always rejected** — any registration with an existing phone returns error, no second account created
    - **Property 3: Invalid credentials produce generic error** — any non-matching phone/credential returns "Invalid phone number or password", does not reveal existence
    - **Validates: Requirements 1.4, 1.8**
    - Tag: `// Feature: cameroon-fashion-app, Property 2: Duplicate phone` and `// Feature: cameroon-fashion-app, Property 3: Invalid credentials`

  - [ ] 2.4 Implement Axios HTTP client service layer with JWT interceptor and session restore
    - Create `src/services/apiClient.ts`: Axios instance, `Authorization: Bearer` header injection, 401 interceptor that calls `POST /auth/refresh` and retries original request
    - Create `src/stores/authStore.ts` (Zustand + `expo-secure-store` persist adapter): `user`, `sessionToken`, `isGuest`, `failedAttempts`, `lockedUntil`, `login()`, `register()`, `logout()`, `restoreSession()`
    - `restoreSession()`: reads JWT from SecureStore, validates via `/auth/refresh`, navigates to role dashboard within 3 seconds; if no token, shows GuestNavigator
    - _Requirements: 1.5, 1.7, 1.10, 1.11_

  - [ ]* 2.5 Write property test for session persistence invariant (Property 4)
    - **Property 4: Session persistence invariant** — for any valid unexpired token in SecureStore, restoreSession navigates to role dashboard without re-auth
    - **Validates: Requirements 1.10, 1.11**
    - Tag: `// Feature: cameroon-fashion-app, Property 4: Session persistence`

- [ ] 3. Backend: Designer, Portfolio, Appointments, and Ranking modules
  - [ ] 3.1 Implement Designer module — directory, profile, availability toggle
    - Create `DesignerModule` with `DesignerController`, `DesignerService`, TypeORM entities: `DesignerEntity`, `PortfolioImageEntity`, `ReviewEntity`
    - `GET /designers?location=&sort=ranking&q=&cursor=`: cursor-based pagination, location filter (exact match), ranking sort (descending; equal scores ordered by `updatedAt` desc), name/location search returning results in ≤3s
    - `GET /designers/:id`: return up to 20 portfolio images, rankingScore, location, availability
    - `PATCH /designers/:id/availability`: toggle `Available` ↔ `Unavailable`; propagate to directory within 60s (Redis cache invalidation)
    - `POST /designers/:id/portfolio`: validate MIME (`image/jpeg`, `image/png`, `image/webp`) and size ≤10MB; return pre-signed S3 URL; record `PortfolioImage` after upload; max 50 images
    - `DELETE /designers/:id/portfolio/:imageId`: remove image record and S3 object
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.8_

  - [ ]* 3.2 Write property test for designer directory location filter (Property 8) and ranking sort (Property 9)
    - **Property 8: Designer directory location filter exclusivity** — all returned designers match the filter location
    - **Property 9: Ranking sort is monotonically non-increasing** — for every adjacent pair D[i], D[i+1]: `D[i].rankingScore >= D[i+1].rankingScore`
    - **Validates: Requirements 4.2, 4.3**
    - Tag: `// Feature: cameroon-fashion-app, Property 8: Location filter` and `// Feature: cameroon-fashion-app, Property 9: Ranking sort`

  - [ ] 3.3 Implement Appointment Manager and Review/Ranking system
    - `GET /designers/:id/appointments`: list appointments grouped by status (Pending, Attended, Unattended, Delivered)
    - `PATCH /appointments/:id/status`: validate transition rules — only `Attended→Delivered` allowed; `Pending/Unattended→Attended` allowed; any other transition returns 422; set `attendedAt` timestamp when marking Attended; set `deliveredAt` when marking Delivered
    - `POST /designers/:id/reviews`: accept score 1–5; recompute `rankingScore = mean(all scores)`, update `reviewCount`; reflect within 5s
    - _Requirements: 5.4, 5.6, 5.7, 5.9_

  - [ ]* 3.4 Write property test for appointment status transitions (Property 12) and Attended timestamp (Property 13)
    - **Property 12: Appointment status transition validity** — Delivered transition succeeds iff current status is Attended; all others fail with error
    - **Property 13: Appointment Attended transition records timestamp** — after marking Attended, `attendedAt` is non-null and >= `requestedAt`
    - **Validates: Requirements 5.6, 5.7**
    - Tag: `// Feature: cameroon-fashion-app, Property 12: Appointment transitions` and `// Feature: cameroon-fashion-app, Property 13: Attended timestamp`

  - [ ]* 3.5 Write property test for ranking score arithmetic mean (Property 14)
    - **Property 14: Ranking score is arithmetic mean of all reviews** — for any sequence of scores 1–5, `rankingScore == mean(scores)` rounded to 1 decimal place
    - **Validates: Requirements 5.9**
    - Tag: `// Feature: cameroon-fashion-app, Property 14: Ranking arithmetic mean`

  - [ ]* 3.6 Write property test for portfolio file upload validation (Property 11)
    - **Property 11: Portfolio file upload validation** — accept iff MIME in {jpeg, png, webp} and size ≤10MB; accept video iff MIME is video type, size ≤200MB, duration ≤300s; reject and never store otherwise
    - **Validates: Requirements 5.1, 5.3, 6.8**
    - Tag: `// Feature: cameroon-fashion-app, Property 11: Portfolio file upload validation`

  - [ ]* 3.7 Write property test for designer/marketer profile rendering completeness (Property 10)
    - **Property 10: Designer and Marketer profile rendering completeness** — rendered designer profile contains name, location, rankingScore (0.0–5.0), availability; rendered marketer directory entry contains name, sub-role, location, portfolio thumbnail
    - **Validates: Requirements 4.1, 4.6, 6.2**
    - Tag: `// Feature: cameroon-fashion-app, Property 10: Profile rendering completeness`

- [ ] 4. Backend: Marketer module and Booking system
  - [ ] 4.1 Implement Marketer module — directory, profile, booking request and response
    - Create `MarketerModule` with `MarketerController`, `MarketerService`, TypeORM entities: `MarketerEntity`, `MarketerFileEntity`, `BookingEntity`
    - `GET /marketers?subRole=&location=&cursor=`: paginate ≤100/page; filter by subRole AND location simultaneously; show booking status ("Available" or "Booked")
    - `GET /marketers/:id`: full profile with all portfolio files and current booking status
    - `POST /marketers/:id/bookings`: validate designerName, description ≤500 chars, proposedStartDate, proposedEndDate; reject with 409 if marketer's bookingStatus is "Booked"; create `BookingEntity` with status "Pending"; enqueue notification job
    - `PATCH /bookings/:id/respond`: Marketer accepts (status→Confirmed, marketerBookingStatus→Booked) or declines (status→Declined); enqueue notification to Designer
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.9_

  - [ ]* 4.2 Write property test for marketer directory filter correctness (Property 15)
    - **Property 15: Marketer directory filter correctness** — all returned marketers match both subRole and location filters simultaneously
    - **Validates: Requirements 6.1**
    - Tag: `// Feature: cameroon-fashion-app, Property 15: Marketer directory filter`

  - [ ]* 4.3 Write property test for active Confirmed booking blocks new requests (Property 17)
    - **Property 17: Active Confirmed booking blocks new booking requests** — any booking request to a marketer whose status is "Booked" is rejected regardless of requester identity
    - **Validates: Requirements 6.9**
    - Tag: `// Feature: cameroon-fashion-app, Property 17: Booking blocks new requests`

- [ ] 5. Backend: Notification Service with retry logic
  - [ ] 5.1 Implement Notification Service using BullMQ with retry logic
    - Create `NotificationModule` with `NotificationService`, `NotificationEntity` (TypeORM), BullMQ queue `notifications`
    - For push notifications: register FCM/APNs token via `POST /devices/token`; send via FCM (Android) or APNs (iOS) when app is in background; deliver in-app banner when in foreground
    - Retry logic: on first delivery failure, retry 3 more times at 60-second intervals (4 total attempts); after all retries, set `status = "Failed"`, log error; record `notificationAttempts` count
    - `GET /notifications?cursor=`: paginated in-app notification list
    - `PATCH /notifications/:id/read`: mark as read
    - If user has denied push permissions, skip FCM/APNs; deliver in-app only
    - _Requirements: 5.5, 6.4, 6.5, 11.1, 11.2, 11.9, 11.10_

  - [ ]* 5.2 Write property test for notification retry — exactly 3 retries before Failed (Property 16)
    - **Property 16: Notification retry — exactly 3 attempts before Failed** — for any notification failing on first attempt, system retries exactly 3 more times (4 total) before marking Failed; `notificationAttempts` reflects actual count
    - **Validates: Requirements 6.5**
    - Tag: `// Feature: cameroon-fashion-app, Property 16: Notification retry`

  - [ ]* 5.3 Write property test for notification payload completeness (Property 28)
    - **Property 28: Notification payload completeness** — for any triggering event, the notification contains all required fields: appointment→clientName+datetime; order→orderId+itemName; booking request→designerName+dateRange; booking response→marketerName+decision
    - **Validates: Requirements 11.3, 11.4, 11.5, 11.6, 11.7, 11.8**
    - Tag: `// Feature: cameroon-fashion-app, Property 28: Notification payload completeness`

- [ ] 6. Backend: Vendor, Marketplace, Cart, Orders, and Delivery
  - [ ] 6.1 Implement Vendor module — catalog management and storefront
    - Create `VendorModule` with `VendorController`, `VendorService`, TypeORM entities: `VendorEntity`, `ListingEntity`, `ListingImageEntity`
    - `POST /vendor/listings`: validate name 1–100, category enum, description 1–1000, price 0.01–999999.99 XAF, images 1–10 each ≤5MB MIME validated; return pre-signed S3 URLs for images; save listing; publish to Marketplace within 60s (Redis cache invalidation or pub/sub)
    - `PATCH /vendor/listings/:id`: update price, availability, images; propagate to Marketplace within 60s; when `inStock=false` show "Out of Stock" indicator; when re-enabled remove indicator within 60s
    - `GET /vendor/orders`: list active orders with buyer display name, item names, quantities, total price, delivery status
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 6.2 Write property test for vendor listing field validation (Property 18)
    - **Property 18: Vendor listing field validation** — accept iff name 1–100, category valid enum, description 1–1000, price 0.01–999999.99, images 1–10 each ≤5MB; reject with inline error otherwise
    - **Validates: Requirements 7.1, 7.2**
    - Tag: `// Feature: cameroon-fashion-app, Property 18: Vendor listing field validation`

  - [ ] 6.3 Implement Marketplace API and Order creation
    - `GET /marketplace?category=&location=&cursor=`: cursor-based pagination; filter by category AND vendor location; return name, price, thumbnail; listings visible within 60s of publish
    - `GET /marketplace/:id`: full listing detail — name, description, price, up to 10 images, vendor info; load within 3s
    - `POST /orders`: validate cart items, confirm all `inStock=true` at time of order; create `OrderEntity` with `paymentStatus=Pending`; then call payment initiation
    - `GET /orders/:id`: order detail with delivery status
    - `PATCH /orders/:id/delivery`: update delivery status to "In Transit" or "Delivered"; notify Client via Notification Service
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7, 8.9_

  - [ ]* 6.4 Write property test for marketplace category and location filter correctness (Property 20)
    - **Property 20: Marketplace category and location filter correctness** — all returned listings satisfy both active filters simultaneously
    - **Validates: Requirements 8.1**
    - Tag: `// Feature: cameroon-fashion-app, Property 20: Marketplace filter correctness`

  - [ ]* 6.5 Write property test for out-of-stock items blocked from cart (Property 19)
    - **Property 19: Out-of-stock items cannot be added to cart** — for any listing with `inStock=false`, addItem returns "Item unavailable" error and cart contents remain unchanged
    - **Validates: Requirements 7.5, 8.4**
    - Tag: `// Feature: cameroon-fashion-app, Property 19: Out-of-stock cart block`

- [ ] 7. Backend: Payment Gateway module
  - [ ] 7.1 Implement Payment Gateway module — MTN MoMo and Orange Money integration
    - Create `PaymentModule` with `PaymentController`, `PaymentService`, TypeORM entity `TransactionEntity`
    - `POST /payments/initiate`: validate amount in [1, 10,000,000] XAF before any provider call (reject with 400 if outside range); send TLS-enforced HTTPS request to selected provider API within 5s; await response max 30s
    - On provider confirmation: record `{ transactionReference, amount, provider, timestamp }` within 5s; update `Order.paymentStatus = 'Paid'`; enqueue vendor notification job
    - On provider failure response: return failure reason; do NOT deduct funds; do NOT update payment status
    - On timeout (>30s) or unreachable error: rollback order to `paymentStatus = 'Pending'`; return error to client; do NOT deduct funds
    - `POST /payments/callback`: verify HMAC signature; reject with 400 if invalid; update transaction and order state
    - `GET /payments/:transactionRef`: transaction status lookup
    - Enforce TLS via NestJS `HttpModule` with `httpsAgent` configured for TLS 1.2+
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 7.2 Write property test for payment amount validation before provider contact (Property 22)
    - **Property 22: Payment amount validation before provider contact** — for any amount < 1 or > 10,000,000 XAF, gateway rejects with validation error and does NOT contact provider API
    - **Validates: Requirements 9.7**
    - Tag: `// Feature: cameroon-fashion-app, Property 22: Payment amount validation`

  - [ ]* 7.3 Write property test for confirmed payment records all required fields (Property 23)
    - **Property 23: Confirmed payment records all required transaction fields** — stored record contains transactionReference (non-empty), amount (positive, valid range), provider ('mtn_momo' or 'orange_money'), timestamp (ISO 8601, within 5s of confirmation)
    - **Validates: Requirements 9.4**
    - Tag: `// Feature: cameroon-fashion-app, Property 23: Payment transaction fields`

  - [ ]* 7.4 Write property test for payment timeout rolls back order (Property 24)
    - **Property 24: Payment timeout rolls back order to Pending** — for any order where provider returns no response within 30s or returns unreachable error, `paymentStatus` is rolled back to "Pending" and no funds recorded
    - **Validates: Requirements 9.5**
    - Tag: `// Feature: cameroon-fashion-app, Property 24: Payment timeout rollback`

  - [ ]* 7.5 Write property test for payment failure preserves cart contents (Property 21)
    - **Property 21: Payment failure preserves cart contents** — for any cart contents at time of payment failure, cart items, quantities, and payment method are identical before and after failure
    - **Validates: Requirements 8.8**
    - Tag: `// Feature: cameroon-fashion-app, Property 21: Cart preserved on payment failure`

- [ ] 8. Backend: Real-Time Chat module (Socket.IO)
  - [ ] 8.1 Implement Chat module — REST conversation endpoints and Socket.IO gateway
    - Create `ChatModule` with `ChatController`, `ChatGateway` (Socket.IO), `ChatService`, TypeORM entities: `ConversationEntity`, `MessageEntity`
    - `GET /conversations`: list conversations for authenticated user
    - `POST /conversations`: create conversation `{ designerId }` from Client; only clients may initiate
    - `GET /conversations/:id/messages?cursor=`: cursor-paginated message history in chronological order (`sentAt` asc)
    - Socket.IO gateway (`transports: ['websocket']`): authenticate via JWT on handshake; handle events:
      - `message:send` → validate text ≤2000 chars or image ≤10MB; persist message with `deliveryStatus=Delivered`; emit `message:new` to recipient within 3s
      - `message:read` → update `deliveryStatus=Read`, set `readAt`, emit `message:read` to sender within 3s
      - `message:delivered` → emit delivery confirmation
    - Retry logic: on send failure increment `retryCount`; retry at 5s intervals up to 3 times; after 3 retries set `deliveryStatus=Failed` and show "Message not delivered" indicator
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7_

  - [ ]* 8.2 Write property test for message validation (Property 25)
    - **Property 25: Message validation — text length and image size** — accept iff text ≤2000 chars; accept image iff size ≤10MB; reject with validation error and do not send otherwise
    - **Validates: Requirements 10.4**
    - Tag: `// Feature: cameroon-fashion-app, Property 25: Message validation`

  - [ ]* 8.3 Write property test for message delivery retry (Property 26)
    - **Property 26: Message delivery retry — exactly 3 attempts before Failed indicator** — on initial delivery failure, retries at 5s intervals exactly 3 times (4 total); after exhaustion marks "Message not delivered"; retryCount never exceeds 3
    - **Validates: Requirements 10.3**
    - Tag: `// Feature: cameroon-fashion-app, Property 26: Message delivery retry`

  - [ ]* 8.4 Write property test for chat history chronological order invariant (Property 27)
    - **Property 27: Chat history chronological order invariant** — for any sequence of messages in a conversation, retrieving history returns messages in non-decreasing order by `sentAt`; no later-sent message appears before earlier-sent
    - **Validates: Requirements 10.7**
    - Tag: `// Feature: cameroon-fashion-app, Property 27: Chat history order`

- [ ] 9. Backend: Inspiration Feed and AI Outfit Generator
  - [ ] 9.1 Implement Feed module and AI Outfit Generator endpoint
    - Create `FeedModule` with `FeedController`, `FeedService`, TypeORM entity `FeedItemEntity`
    - `GET /feed?cursor=&limit=10`: cursor-based pagination; each batch ≥10 items when items remain; return `{ items, nextCursor, hasMore }`; when no items, return `hasMore: false`
    - `GET /feed/:id`: single feed item with full image URL and style tags
    - `GET /feed/:id/designers?location=`: return designers whose `location` exactly matches client's location; return empty list with message if none
    - `POST /outfit/generate`: validate prompt 1–500 chars (reject with 400 otherwise); proxy to OpenAI GPT-4o (concept text) + DALL-E 3 (image); enforce 10s server-side timeout; return concept text + image URL
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]* 9.2 Write property test for feed batch size invariant (Property 5)
    - **Property 5: Inspiration Feed batch size invariant** — any non-empty feed API response contains ≥10 items; when no more items available, `hasMore=false` with no empty non-terminal batch
    - **Validates: Requirements 3.1, 3.9**
    - Tag: `// Feature: cameroon-fashion-app, Property 5: Feed batch size`

  - [ ]* 9.3 Write property test for Send-to-Designer location match (Property 6)
    - **Property 6: Send-to-Designer returns only location-matched designers** — for any client location and designer database, returned designers contain only those with matching location
    - **Validates: Requirements 3.3**
    - Tag: `// Feature: cameroon-fashion-app, Property 6: Send-to-Designer location match`

  - [ ]* 9.4 Write property test for Outfit Generator prompt validation (Property 7)
    - **Property 7: Outfit Generator prompt validation** — accept iff 1–500 chars; reject empty or >500 with validation error; no AI request dispatched for invalid prompts
    - **Validates: Requirements 3.4, 3.5**
    - Tag: `// Feature: cameroon-fashion-app, Property 7: Outfit Generator prompt validation`

- [ ] 10. Checkpoint — Backend complete
  - Ensure all NestJS modules compile without errors, all unit and property tests pass, and the local dev server starts. Ask the user if any backend behavior needs adjustment before proceeding to frontend.

- [ ] 11. React Native: Navigation structure
  - [ ] 11.1 Implement RootNavigator and all sub-navigators with role-based gating
    - Create `src/navigation/RootNavigator.tsx`: reads `authStore.user` and `authStore.isGuest`; routes to `OnboardingNavigator` (first launch), `AuthNavigator` (unauthenticated), `GuestNavigator` (no session, no sign-in), or role-specific tab navigator
    - Create `src/navigation/AuthNavigator.tsx`: LoginScreen + RegisterScreen stack
    - Create `src/navigation/GuestNavigator.tsx`: GuestFeedTab (InspirationFeed read-only + ImageDetail no action buttons) + GuestMarketplaceTab (Marketplace read-only + ListingDetail no Add to Cart) + SignInPromptModal
    - Create `ClientTabs.tsx`, `DesignerTabs.tsx`, `VendorTabs.tsx`, `MarketerTabs.tsx` bottom tab navigators with all nested stacks per the navigation structure in design.md
    - Implement deep-link handler `cfashion://screen?params` for notification taps; navigate to relevant screen within 2s
    - _Requirements: 1.5, 1.7, 2.1, 2.2, 2.3, 2.4, 11.9, 13.1, 13.2_

  - [ ]* 11.2 Write property test for guest session access invariant (Property 31)
    - **Property 31: Guest session access invariant** — for any app state in guest mode, navigation options and rendered buttons exclude: Outfit Generator, Chat, Designer Directory, booking, "Send to Designer", "Add to Cart", checkout; restricted feature attempts trigger sign-in prompt; only Feed (read-only) and Marketplace (read-only) accessible
    - **Validates: Requirements 13.2, 13.3, 13.4, 13.5**
    - Tag: `// Feature: cameroon-fashion-app, Property 31: Guest access invariant`

- [ ] 12. React Native: Authentication screens and stores
  - [ ] 12.1 Implement LoginScreen, RegisterScreen, and PinSetup screen
    - `LoginScreen`: `react-hook-form` + Zod for phone (E.164 pattern) and password (≥8 chars) or PIN (4–6 digits); show "Invalid phone number or password" on failure; show lockout message with duration on HTTP 423; call `authStore.login()`
    - `RegisterScreen`: validate all fields with Zod (fullName 1–100, phone E.164, location 1–100, role enum); when Marketer selected show sub-role picker (Model / Content_Creator); inline error on each invalid field; on success navigate to role dashboard within 3s
    - Apply Afrocentric palette, minimum 44×44pt touch targets, `accessibilityLabel` on all inputs and buttons; bilingual strings from i18n
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.9, 12.7, 12.8_

  - [ ] 12.2 Wire authStore session restore to app launch
    - In `App.tsx` call `authStore.restoreSession()` on mount; navigate to role dashboard within 3s if valid token; navigate to GuestNavigator if none
    - Implement `uiStore.ts` (Zustand): `language`, `theme`, toast queue; persist `language` in AsyncStorage
    - `LanguagePicker` screen: switch language → reload all UI text within 2s without full restart (i18n `changeLanguage()`); if language file unavailable, retain previous, show error
    - _Requirements: 1.10, 1.11, 12.4, 12.5_

- [ ] 13. React Native: Role-specific Dashboards
  - [ ] 13.1 Implement Client Dashboard — entry points and Afrocentric layout
    - Create `ClientDashboard` screen: clearly labeled entry points to Inspiration Feed, Designer Directory, Marketplace, Chat within 3s of login
    - Use only Afrocentric palette colors (Kente Gold, Sahara Sunset, Congo Royale, Bamileke Earth, Savanna Bloom) for all surfaces and components
    - Handle data load failure within 5s: show error banner with Retry; retain last cached state
    - _Requirements: 2.1, 2.5, 2.6_

  - [ ] 13.2 Implement Designer Dashboard, Vendor Dashboard, and Marketer Dashboard
    - `DesignerDashboard`: entry points to Appointment Manager, Portfolio management, Marketer Directory; work summary (completed fits count, pending appointments count) within 3s
    - `VendorDashboard`: entry points to catalog management, active Orders list, delivery tracking within 3s
    - `MarketerDashboard`: Portfolio thumbnail grid, pending booking requests count, booking history list within 3s
    - All dashboards use Afrocentric palette exclusively; error banner + Retry on load failure
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 13.3 Implement GuestDashboard with Sign In / Sign Up banner
    - Persistent non-intrusive "Sign In / Sign Up" banner/button on guest dashboard; does not block content browsing
    - No entry points to Outfit Generator, Chat, Designer Directory, or booking features
    - On guest attempting restricted feature: show prompt with Login + Register buttons
    - _Requirements: 13.1, 13.2, 13.5, 13.6_

- [ ] 14. React Native: Inspiration Feed, ImageDetail, and Outfit Generator screens
  - [ ] 14.1 Implement InspirationFeed screen with FlashList and infinite scroll
    - `InspirationFeed`: FlashList two-column masonry layout, `expo-image` for caching; `onEndReached` at threshold 0.3 calls `feedStore.fetchNextBatch()`; `ListFooterComponent` shows `LoadingSpinner` or `EndOfFeedIndicator`
    - `feedStore.ts` (Zustand): `items`, `cursor`, `hasMore`, `isLoading`, `lastScrollPosition`; `fetchNextBatch()` calls `GET /feed?cursor=&limit=10`; persists scroll position for guest→auth restore
    - In guest mode: render feed items read-only, no "Send to Designer" or "Generate Outfit" buttons
    - _Requirements: 3.1, 3.9, 13.3_

  - [ ] 14.2 Implement ImageDetail bottom sheet and OutfitGenerator screen
    - `ImageDetailSheet` (bottom sheet): full image with pinch-to-zoom, style tags chip row; "Send to Designer" button (hidden in guest) → calls `GET /feed/:id/designers?location=` → show matching designers or "No designers available in your area"
    - "Generate Outfit" button (hidden in guest) → navigates to OutfitGeneratorScreen
    - `OutfitGeneratorScreen`: TextInput with `maxLength=500` and character counter; `GenerateButton` → `POST /outfit/generate`; 10s client-side timeout; show loading state; on success show concept text + image + "Send to Designer" (via Chat) + "Save to Profile"; on error show message + RetryButton (pre-filled prompt, no re-entry)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 13.3_

  - [ ] 14.3 Implement guest→auth feed scroll position restoration
    - On successful authentication from guest state, `feedStore.lastScrollPosition` is read and InspirationFeed is scrolled to that position during dashboard transition
    - _Requirements: 13.7_

  - [ ]* 14.4 Write property test for feed scroll position restored after guest auth (Property 32)
    - **Property 32: Feed scroll position restored after guest authentication** — for any scroll position recorded in guest feed at time of auth initiation, completing auth results in feed scrolled to that same position
    - **Validates: Requirements 13.7**
    - Tag: `// Feature: cameroon-fashion-app, Property 32: Feed scroll position restored`

- [ ] 15. React Native: Designer Discovery and Profile screens
  - [ ] 15.1 Implement DesignerDirectory and DesignerProfile screens
    - `DesignerDirectory`: FlashList of designer cards each showing name, location, rankingScore (0.0–5.0), portfolio thumbnail; location filter dropdown; ranking sort (descending, equal scores by recency); search field (1–100 chars, results within 3s via `GET /designers?location=&sort=ranking&q=&cursor=`)
    - On no match: "No designers found in this location"
    - `DesignerProfile`: navigate within 2s on card tap; show up to 20 portfolio images, ranking score, location, availability badge ("Available" / "Busy" / "Unavailable"); "Message" button → opens/creates ChatThread
    - On profile load failure: show error, preserve directory filter state
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ] 15.2 Implement Designer Portfolio management and Availability toggle (Designer-facing)
    - `PortfolioGrid` screen (Designer): display all uploaded images; `ImageUpload` screen: `expo-image-picker`; validate MIME (jpeg/png/webp) and size ≤10MB client-side with Zod before requesting pre-signed URL; `mediaUploadService.ts` uploads directly to S3; after upload, image appears on public profile within 5s; max 50 images; error message for unsupported format or size violation
    - Availability toggle: PATCH `/designers/:id/availability`; reflects in Designer Directory within 60s
    - _Requirements: 5.1, 5.2, 5.3, 5.8_

  - [ ] 15.3 Implement AppointmentList and AppointmentDetail screens (Designer-facing)
    - `AppointmentList`: categorized tabs — Pending, Attended, Unattended; `AppointmentDetail`: action buttons "Mark Attended" and "Mark Delivered" (Delivered only enabled when status=Attended); on invalid transition show error message
    - When new appointment request received: push notification delivered within 10s (via NotificationService); notification contains client name and requested date/time
    - When Designer updates appointment status: notify Client via push notification with new status and Designer name
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 11.3, 11.4_

- [ ] 16. React Native: Marketer Directory and Booking screens
  - [ ] 16.1 Implement MarketerDirectory and MarketerProfile screens (Designer-facing)
    - `MarketerDirectory`: paginated list ≤100/page; filterable by sub-role (Model / Content_Creator) and location; each entry shows name, sub-role, location, portfolio thumbnail (max 500KB, 300×300 display); navigate to full profile within 2s
    - `MarketerProfile`: full portfolio (images + videos), current booking status ("Available" or "Booked"); if Booked, disable "Request Booking" button
    - _Requirements: 6.1, 6.2, 6.3, 6.9_

  - [ ] 16.2 Implement BookingForm and booking response screens (Marketer-facing)
    - `BookingForm` (Designer-facing): fields for description (≤500 chars, validated with Zod), proposed date range; submit → `POST /marketers/:id/bookings`; on submit: notification delivered to Marketer within 30s
    - `PendingBookings` (Marketer-facing): list of pending booking requests each showing Designer name, description, proposed dates; "Accept" / "Decline" actions → `PATCH /bookings/:id/respond`; on accept: update status to Confirmed, notify Designer within 30s; on decline: update to Declined, notify Designer within 30s
    - `BookingHistory` screen (Marketer-facing): list of all past bookings
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 11.7, 11.8_

  - [ ] 16.3 Implement Marketer portfolio upload screen
    - `MediaUpload` (Marketer-facing): `expo-image-picker` for images (JPEG/PNG ≤10MB each) and `expo-video` for video (≤200MB, ≤5min / 300s duration); validate all constraints client-side before requesting pre-signed S3 URL; max 50 files total; error message for violations
    - _Requirements: 6.8_

- [ ] 17. React Native: Vendor screens and Marketplace
  - [ ] 17.1 Implement CatalogManager, ListingForm, and OrderList screens (Vendor-facing)
    - `CatalogList`: list of vendor's listings with name, price, stock status; tap to edit
    - `ListingForm`: fields for name (1–100), category (dropdown: clothes/accessories/shoes/hairstyle_products_services), description (1–1000), price (0.01–999999.99 XAF), image upload (1–10 images, ≤5MB each via `expo-image-picker`); validate all fields client-side with Zod; inline error per offending field; on success, listing appears in Marketplace within 60s
    - "Out of Stock" / "Available" toggle per listing; changes reflected in Marketplace within 60s
    - `OrderList`: active orders showing buyer display name, item names, quantities, total price, delivery status
    - `DeliveryTracking` screen: update delivery status (Pending → In Transit → Delivered) via `PATCH /orders/:id/delivery`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 17.2 Implement Marketplace, ListingDetail, Cart, and Checkout screens (Client-facing)
    - `Marketplace`: FlashList; filter by category and vendor location; each item shows name, price, thumbnail; load detail within 3s; guest mode: read-only, no Add to Cart
    - `ListingDetail`: name, description, price, up to 10 images, vendor info; "Add to Cart" button disabled (with "Item unavailable" message) when `inStock=false`; on Add to Cart success, cart badge count updates within 1s
    - `Cart` screen: list of items with quantities, unit prices, subtotal; "Checkout" button
    - `Checkout` screen: order summary (items, quantities, unit prices, subtotal, delivery fee); `PaymentMethodSelector` (MTN MoMo / Orange Money); "Confirm Order" → `POST /orders` → `POST /payments/initiate`
    - `OrderConfirmation` screen: order reference number, estimated delivery date; on payment failure show reason, preserve cart, offer retry / alternative payment method
    - `cartStore.ts` (Zustand): `items`, `addItem()`, `removeItem()`, `clear()`; derived `total` and `itemCount`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 13.4_

- [ ] 18. React Native: Real-Time Chat screens and Socket.IO client
  - [ ] 18.1 Implement socketClient.ts and chatStore.ts
    - `socketClient.ts`: Socket.IO singleton; `transports: ['websocket']`; JWT authentication on handshake; auto-reconnect with exponential backoff on disconnect; manage connection lifecycle with app foreground/background events
    - `chatStore.ts` (Zustand): `conversations`, `activeMessages`, `socketStatus`; `sendMessage()`, `openConversation()`, `markRead()`; retry logic (3 retries at 5s intervals); after 3 retries set `deliveryStatus=Failed`
    - `ConnectionStatusBanner`: shown when `socketStatus !== 'connected'`
    - _Requirements: 10.2, 10.3, 10.6_

  - [ ] 18.2 Implement ConversationList and ChatThread screens
    - `ConversationList`: list of conversations sorted by most recent message; tap → navigate to ChatThread
    - `ChatThread`: FlashList inverted (newest at bottom); `MessageBubble` with text or image content, minute-precision timestamp, ReadReceipt (`Delivered` → `Read` within 3s of recipient opening)
    - `MessageInput`: TextInput `maxLength=2000`, character counter; `AttachmentButton` via `expo-image-picker` (max 10MB); `SendButton` → `socketClient.emit('message:send', ...)`
    - When app in background: push notification with sender name and up to 100-char preview
    - New conversation initiated from DesignerProfile "Message" button → `POST /conversations`
    - Persist message history from `GET /conversations/:id/messages?cursor=`; new messages via socket
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 10.7_

- [ ] 19. React Native: Notification Service and NotificationCenter screen
  - [ ] 19.1 Implement notificationService.ts and NotificationCenter screen
    - `notificationService.ts`: register FCM/APNs device push token via `POST /devices/token`; handle foreground notifications (in-app banner via `notificationStore` toast queue, visible ≥4s, auto-dismiss); handle background notifications (tapped → deep-link navigation within 2s)
    - If user denied push permissions: skip FCM/APNs registration; display all notifications as in-app banners only
    - `notificationStore.ts` (Zustand): `notifications`, `unreadCount`; driven by socket events or API polling
    - `NotificationCenter` screen: paginated list via `GET /notifications?cursor=`; mark read via `PATCH /notifications/:id/read`
    - _Requirements: 11.1, 11.2, 11.9, 11.10_

- [ ] 20. React Native: Accessibility and UI compliance
  - [ ] 20.1 Audit and implement accessibility labels, touch targets, and layout constraints
    - Add `accessibilityLabel` (distinct from placeholder) and `accessible={true}` props to every interactive and informational element across all screens
    - Ensure all interactive elements have minimum 44×44pt touch targets using `minHeight`/`minWidth` or `hitSlop`
    - Test layouts at 320pt and 428pt widths; fix any overflow, misalignment, or text truncation
    - Verify all UI surfaces use only Afrocentric palette colors; ensure ≥80% surface coverage from palette tokens
    - _Requirements: 12.1, 12.2, 12.7, 12.8_

  - [ ] 20.2 Add snapshot tests for role dashboards and key components
    - Snapshot tests for: ClientDashboard, DesignerDashboard, VendorDashboard, MarketerDashboard (light theme)
    - Snapshot test for `FeedItem` component with various image aspect ratios
    - Snapshot test for `NotificationBanner` in foreground state
    - Visual layout render tests at 320pt and 428pt for all dashboard and key screens
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.1, 12.2_

- [ ] 24. Backend — Training Programs module
  - [ ] 24.1 Implement TrainingModule (NestJS): TrainingController, TrainingService, TypeORM entities TrainingProgramEntity, TrainingApplicationEntity
    - `POST /designers/:id/training-programs`: validate all fields (title 1–150, description 1–2000, durationCategory enum, startDate >= today, maxCapacity 1–500, price 1–10,000,000 XAF, timetable 1–5000 chars); save with status "Draft"; return 400 with inline errors on violation
    - `PATCH /training-programs/:id`: update fields; when status transitions to "Published", trigger Redis cache invalidation; reflects on Designer_Profile within 60s
    - `POST /training-programs/:id/apply`: call Payment_Gateway first; on confirmed payment create TrainingApplication with status "Pending"; on payment failure return error, create no record; notify Designer within 30s via Notification_Service
    - `PATCH /training-applications/:id/respond`: accept → check enrolledCount < maxCapacity (return 409 if full), set status "Accepted", increment enrolledCount, notify Client; reject → set status "Rejected", notify Client
    - `GET /training-programs/:id/applications`: list all applications with applicant name, status, paymentReference
    - `GET /training-programs?durationCategory=&location=&cursor=`: cursor-paginated, filtered, returns published programs only
    - `GET /training-programs/:id`: program detail
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11, 14.12, 14.13, 14.14_

  - [ ]* 24.2 Write property test for Training Program field validation (Property 33)
    - **Property 33: Training Program field validation — valid inputs accepted, invalid inputs rejected**
    - For any combination of training program fields, accept iff all constraints satisfied; reject with inline error per offending field otherwise
    - **Validates: Requirements 14.1, 14.2**
    - Tag: `// Feature: cameroon-fashion-app, Property 33: Training Program field validation`

  - [ ]* 24.3 Write property test for enrollment capacity enforcement (Property 34)
    - **Property 34: Training enrollment capacity enforcement — accept application attempt iff enrolledCount < maxCapacity; reject with error if slots exhausted**
    - **Validates: Requirements 14.9, 14.12**
    - Tag: `// Feature: cameroon-fashion-app, Property 34: Training enrollment capacity`

  - [ ]* 24.4 Write property test for training application payment gate (Property 35)
    - **Property 35: Training application payment gate — TrainingApplication record created iff Payment_Gateway returns confirmed success; any other outcome (failure, timeout) creates zero records**
    - **Validates: Requirements 14.6, 14.7, 14.8**
    - Tag: `// Feature: cameroon-fashion-app, Property 35: Training application payment gate`

  - [ ]* 24.5 Write integration test for training application end-to-end flow
    - Client applies → payment confirmed (mocked) → TrainingApplication created (status Pending) → Designer notified within 30s → Designer accepts → Client notified, enrolledCount incremented by 1
    - Test capacity guard: fill all slots, attempt one more accept → verify 409 returned, enrolledCount unchanged
    - Test timetable update notification: update timetable → verify all accepted applicants notified within 30s (mocked push)

- [ ] 25. Backend — Designer Planner module
  - [ ] 25.1 Implement PlannerModule (NestJS): PlannerController, PlannerService, TypeORM entity PlannerEventEntity
    - `GET /designers/:id/planner?from=&days=30`: aggregate planner events from 3 sources — (1) training sessions derived from published TrainingProgram timetables for programs owned by the designer, (2) Appointment records with status Pending or Attended, and (3) Appointment records in Attended status not yet Delivered (delivery deadlines); also include custom PlannerEvents; return consolidated day-keyed structure within 3s
    - Conflict detection: for each day in the response, set conflictIndicator=true iff the day contains ≥1 training session AND (≥1 Pending/Attended appointment OR ≥1 outstanding delivery deadline)
    - `POST /designers/:id/planner/events`: create custom event; validate title 1–200 chars, date present; return 400 with inline error on violation; persist and reflect within 5s
    - `PATCH /designers/:id/planner/events/:eventId`: update title or date of custom event
    - `DELETE /designers/:id/planner/events/:eventId`: delete custom event
    - `POST /designers/:id/planner/notes`: upsert day note for given date; validate content 1–1000 chars; persist within 5s
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ]* 25.2 Write property test for planner conflict indicator correctness (Property 36)
    - **Property 36: Planner conflict indicator correctness — conflict indicator shown iff training session AND (appointment or delivery) on same day; training-only or appointment-only days show no indicator**
    - **Validates: Requirements 15.3**
    - Tag: `// Feature: cameroon-fashion-app, Property 36: Planner conflict indicator`

  - [ ]* 25.3 Write integration test for planner render
    - Seed designer with published training programs, pending appointments, and attended-but-undelivered appointments; call `GET /designers/:id/planner?from=today&days=30`; verify all 3 event types appear; verify conflict indicator appears only on days with both training and appointment events; verify response time ≤3s

- [ ] 26. Backend — Collaboration module
  - [ ] 26.1 Implement CollaborationModule (NestJS): CollaborationController, CollaborationService, TypeORM entities: CollaborationProjectEntity, CollaborationInvitationEntity, WorkspaceNoteEntity, WorkspaceFileEntity, WorkspaceUpdateEntity
    - `POST /designers/:id/collaborations`: validate title 1–150, description 1–2000, requiredSkills 1–500, deadline >= today, collaboratorSlots 1–20; save project; reflect on Designer_Profile within 60s (portfolio item)
    - `POST /collaborations/:id/invite`: check participants.length < collaboratorSlots (return 409 if full); create CollaborationInvitation with status Pending; notify invitee within 30s (include inviting designer name, project title, required skills)
    - `PATCH /collaboration-invitations/:id/respond`: accept → add invitee to participants array, decrement collaboratorSlots, set status Accepted, notify inviter within 30s; decline → set status Declined, notify inviter within 30s
    - Workspace endpoints: `GET/POST /collaborations/:id/workspace/notes`; `GET/POST /collaborations/:id/workspace/files` (pre-signed S3 URL, validate MIME jpeg/png/webp/pdf ≤10MB, max 50 files per project); `GET/POST /collaborations/:id/workspace/updates`; on POST to any workspace endpoint, notify all OTHER participants within 30s
    - `GET /designers/:id/collaborations`: list all projects the designer created or participates in
    - `GET /collaborations/:id`: project detail with participants, deadline, status
    - Deadline auto-complete: BullMQ scheduled job checks daily; projects where deadline < now and status = Active → set status = Completed; retain on all participant profiles
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10, 16.11_

  - [ ]* 26.2 Write property test for Collaboration Project field validation (Property 37)
    - **Property 37: Collaboration Project field validation — valid inputs accepted, invalid inputs rejected**
    - For any combination of collaboration project fields, accept iff all constraints satisfied; reject with inline error per offending field otherwise
    - **Validates: Requirements 16.1, 16.2**
    - Tag: `// Feature: cameroon-fashion-app, Property 37: Collaboration Project field validation`

  - [ ]* 26.3 Write property test for slot exhaustion blocks invitations (Property 38)
    - **Property 38: Collaboration slot exhaustion blocks invitations — when participants.length == collaboratorSlots, any invitation attempt returns error, creates no CollaborationInvitation, sends no notification**
    - **Validates: Requirements 16.7**
    - Tag: `// Feature: cameroon-fashion-app, Property 38: Collaboration slot exhaustion`

  - [ ]* 26.4 Write integration test for collaboration lifecycle
    - Create project → verify portfolio item on Designer_Profile within 60s
    - Send invitation → invitee notified within 30s (mocked) → invitee accepts → participant list updated, slots decremented, inviter notified
    - Full-slots guard: fill all slots, attempt another invitation → verify 409 returned
    - Workspace post: participant posts note → all OTHER participants notified within 30s (mocked)
    - Deadline auto-complete: set deadline to past (via test clock) → trigger job → verify status = Completed, project retained on all participant profiles

- [ ] 27. React Native — Training screens (Client-facing)
  - [ ] 27.1 Implement TrainingDirectory and TrainingProgramDetail screens (Client-facing)
    - `TrainingDirectory`: FlashList of published training programs; filter bar with duration category toggle (short-term / long-term) and designer location filter; each card shows title, duration category, start date, price in XAF, remaining enrollment slots; tap → TrainingProgramDetail
    - `TrainingProgramDetail`: full program info (title, description, timetable, start date, max capacity, remaining slots, price); "Apply & Pay" button
    - "Apply & Pay" flow: PaymentMethodSelector (MTN MoMo / Orange Money) → `POST /training-programs/:id/apply` → on success show confirmation; on failure show error and allow retry; no application record created on failure
    - `TrainingApplicationStatus` screen: shows current application status (Pending, Accepted, Rejected) and Training_Badge when Accepted
    - _Requirements: 14.4, 14.5, 14.6, 14.7, 14.8, 14.11_

- [ ] 28. React Native — Training screens (Designer-facing)
  - [ ] 28.1 Implement TrainingProgramList, TrainingProgramForm, and ApplicationList screens (Designer-facing)
    - `TrainingProgramList`: list of the designer's training programs; create new button
    - `TrainingProgramForm`: fields for title (1–150), description (1–2000), durationCategory picker (short-term / long-term), start date picker (≥ today), maxCapacity (1–500), price (1–10,000,000 XAF), timetable (1–5000 chars text area); validate all fields with Zod client-side; inline error per offending field; submit → `POST /designers/:id/training-programs`; edit → `PATCH /training-programs/:id`; on timetable update: notify accepted applicants
    - `ApplicationList`: list of all applications per program showing applicant name, status, payment reference; "Accept" and "Reject" action buttons; on accept: check remaining slots > 0 (show error if 0); `PATCH /training-applications/:id/respond`
    - `trainingStore.ts` (Zustand): programs, applications, enrollmentState, fetchPrograms(), fetchApplications(), respondToApplication()
    - _Requirements: 14.1, 14.2, 14.3, 14.9, 14.10, 14.12, 14.13, 14.14_

- [ ] 29. React Native — Designer Planner screen
  - [ ] 29.1 Implement PlannerCalendar, DayDetail, and AddEvent screens (Designer-facing)
    - `PlannerCalendar`: react-native-calendars calendar view; `GET /designers/:id/planner?from=today&days=30` on mount; render within 3s; show conflict indicator (e.g., orange dot) on days with both training and appointment events; show summary dots per event type per day (training = green, appointment = blue, delivery = red, custom = grey)
    - `DayDetail`: tap a day → show day detail: list of training sessions, appointments (Pending/Attended), delivery deadlines, custom events, and day note; show count summary (training sessions, pending appointments, outstanding deliveries); "Add Note" button → inline text input (1–1000 chars) → `POST /designers/:id/planner/notes`
    - `AddEvent` screen: title (1–200 chars) + date picker; submit → `POST /designers/:id/planner/events`; reflected in calendar within 5s; validation: inline error if title empty or no date selected
    - `plannerStore.ts` (Zustand): events, notes, conflictDays, fetchPlanner(), addEvent(), addNote()
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [ ] 30. React Native — Collaboration screens (Designer-facing)
  - [ ] 30.1 Implement CollaborationList, CollaborationDetail, CollaborationWorkspace, and InviteDesigner screens
    - `CollaborationList`: list of all projects the designer created or participates in, each showing title, participant count, deadline, status (Active / Completed); create new button
    - `CollaborationDetail`: project info (title, description, required skills, deadline, collaborator slots remaining, participant designer names); "Invite Designer" button (disabled if slots = 0); project status badge
    - `InviteDesigner` screen: searchable list of Designers (reuses Designer_Directory query); select designer → `POST /collaborations/:id/invite`; show error if slots = 0
    - `CollaborationWorkspace`: tabbed interface with Notes, Files, and Updates tabs
      - Notes tab: FlashList of shared notes; "Add Note" input (1–2000 chars) → `POST /collaborations/:id/workspace/notes`
      - Files tab: list of uploaded files with name and mime type; "Upload File" → expo-document-picker → validate MIME (jpeg/png/webp/pdf) and size ≤10MB client-side → request pre-signed S3 URL → upload; error message on violation; max 50 files guard
      - Updates tab: list of progress updates; "Post Update" input (1–1000 chars) → `POST /collaborations/:id/workspace/updates`
      - On any post/upload: notify all other participants via Notification_Service
    - CollaborationProject displayed on Designer_Profile as portfolio item (title, participant names, deadline, status)
    - `collaborationStore.ts` (Zustand): projects, invitations, workspaceNotes, workspaceFiles, workspaceUpdates
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10, 16.11_

- [ ] 21. Checkpoint — Full integration and end-to-end wiring
  - Ensure all frontend screens connect to the backend API correctly. Verify the complete order flow (add to cart → checkout → payment → order created → vendor notified), the full chat lifecycle (send → deliver → read receipt), the booking flow (submit → notification retry → accept/decline), and the guest→auth transition with scroll restore. Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Integration tests
  - [ ]* 22.1 Write integration test for end-to-end order flow
    - Add to cart → confirm order → `POST /payments/initiate` (mocked MTN MoMo/Orange Money with Nock) → payment success → order created with `paymentStatus=Paid` → vendor notified via BullMQ
    - Test payment failure path: cart preserved, order rolled back to Pending
    - _Requirements: 8.6, 8.7, 8.8, 9.1, 9.2, 9.5_

  - [ ]* 22.2 Write integration test for booking notification retry
    - Submit booking → NotificationService attempts delivery → simulate 3 failures → verify exactly 4 total attempts → verify status = "Failed" and error logged
    - _Requirements: 6.4, 6.5_

  - [ ]* 22.3 Write integration test for real-time chat lifecycle
    - Client sends message → socket delivers to Designer → Designer marks read → Client receives read receipt; verify `deliveryStatus` transitions: Sending → Delivered → Read
    - _Requirements: 10.2, 10.6_

  - [ ]* 22.4 Write integration test for session refresh flow
    - Expired access token → Axios interceptor calls `POST /auth/refresh` → new access token issued → original request retried successfully
    - _Requirements: 1.10, 1.11_

- [ ] 23. Final checkpoint — Ensure all tests pass
  - Run full test suite (unit tests, property-based tests, integration tests, snapshot tests). Verify zero TypeScript compile errors on both frontend and backend. Ask the user if any questions arise before handoff.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP — they cover property-based tests and integration tests that validate universal correctness properties.
- Each task references specific requirements for full traceability back to `requirements.md`.
- All 32 correctness properties from `design.md` are covered by `*`-marked property test sub-tasks; each is annotated with its property number and the requirements clause it validates.
- Property tests use `fast-check` with a minimum of 100 iterations per test. Each test file includes the tag comment `// Feature: cameroon-fashion-app, Property N: ...`.
- Checkpoints (tasks 10, 21, 23) are synchronization gates — do not proceed past them until all preceding tests pass.
- Backend and frontend tasks in groups 1–9 and 11–19 are mostly independent and can be developed in parallel streams once the shared foundation (task 1) is complete.
- Media uploads go directly from client to S3 via pre-signed URLs; the backend never buffers large files.
- All list endpoints use cursor-based pagination; never use offset-based pagination.
- The Socket.IO gateway uses `transports: ['websocket']` only — no HTTP long-polling fallback.
- TLS 1.2+ is enforced on all payment API calls via `httpsAgent` in the NestJS `HttpModule`.
- `expo-secure-store` (iOS Keychain / Android Keystore) is used for JWT tokens; `AsyncStorage` for non-sensitive preferences (language, theme).

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "3.1", "4.1", "5.1", "6.1", "7.1", "8.1", "9.1"] },
    { "id": 4, "tasks": ["2.5", "3.2", "3.3", "4.2", "4.3", "5.2", "5.3", "6.2", "6.3", "7.2", "7.3", "8.2", "9.2", "9.3", "9.4"] },
    { "id": 5, "tasks": ["3.4", "3.5", "3.6", "3.7", "6.4", "6.5", "7.4", "7.5", "8.3", "8.4", "11.1"] },
    { "id": 6, "tasks": ["11.2", "12.1", "12.2", "13.1", "13.2", "13.3"] },
    { "id": 7, "tasks": ["14.1", "14.2", "15.1", "16.1", "17.1", "18.1", "19.1", "24.1", "25.1", "26.1"] },
    { "id": 8, "tasks": ["14.3", "14.4", "15.2", "15.3", "16.2", "16.3", "17.2", "18.2", "24.2", "24.3", "24.4", "24.5", "25.2", "25.3", "26.2", "26.3", "26.4"] },
    { "id": 9, "tasks": ["20.1", "20.2", "27.1", "28.1", "29.1", "30.1"] },
    { "id": 10, "tasks": ["22.1", "22.2", "22.3", "22.4"] }
  ]
}
```
