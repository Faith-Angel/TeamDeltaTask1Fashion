# Design Document: Cameroon Fashion App

## Overview

The Cameroon Fashion App is a cross-platform React Native mobile application connecting four distinct roles — Clients, Designers, Vendors, and Marketers — within Cameroon's fashion ecosystem. It enables fashion discovery, designer collaboration, marketplace commerce, marketer bookings, and real-time messaging. The platform integrates local payment solutions (MTN Mobile Money and Orange Money), an AI-powered outfit generator, and a culturally resonant Afrocentric UI.

Key design goals:
- Single React Native codebase deployable to iOS and Android
- Role-based navigation with guest mode for unauthenticated users
- Offline-resilient persistent sessions (JWT + secure storage)
- Real-time messaging via WebSocket/Socket.IO
- TLS-enforced payment pipeline through MTN MoMo and Orange Money APIs
- Bilingual EN/FR interface via react-i18next
- Afrocentric visual identity (Kente Gold, Sahara Sunset, Congo Royale, Bamileke Earth, Savanna Bloom)

---

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Client                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Navigation  │  │  UI Layer    │  │  i18n (EN/FR)    │  │
│  │ (React Nav 6)│  │  Components  │  │  react-i18next   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              State Management (Zustand)               │   │
│  │  authStore  feedStore  chatStore  cartStore  uiStore  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer                            │   │
│  │  ApiClient  SocketClient  NotificationService         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              │ HTTPS/REST          │ WSS/Socket.IO
              ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth    │ │  Feed /  │ │ Payment  │ │  Chat/Socket  │  │
│  │  Module  │ │Marketplace│ │ Gateway  │ │    Gateway    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Designer │ │ Marketer │ │Notification│                    │
│  │ Module   │ │  Module  │ │  Service  │                    │
│  └──────────┘ └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
              │                     │              │
        ┌─────┴──────┐     ┌───────┴──┐    ┌─────┴──────┐
        │ PostgreSQL │     │  Redis   │    │   AWS S3   │
        │ (primary)  │     │ (cache/  │    │  (media    │
        │            │     │  queues) │    │  storage)  │
        └────────────┘     └──────────┘    └────────────┘
              │                                   │
        ┌─────┴──────────────────────────────────┐
        │         External Services               │
        │  MTN MoMo API  |  Orange Money API      │
        │  AI Outfit Service  |  FCM / APNs       │
        └─────────────────────────────────────────┘
```

### Architectural Decisions

**NestJS for Backend**: Provides a structured, module-based architecture with built-in support for WebSockets (Socket.IO gateway), dependency injection, Guards for role-based access control, and TypeScript-first development. This pairs cleanly with the React Native frontend.

**Zustand for State Management**: Chosen over Redux Toolkit for this app because Zustand offers a minimal, hooks-based API with no boilerplate, performs well on low-end Android devices common in Cameroon, and supports slice-based stores that map naturally to the domain (auth, feed, cart, chat, notifications). Redux Toolkit would be appropriate for a larger team needing stricter conventions and time-travel debugging; Zustand is a better fit for a mobile-first product at this scale.

**PostgreSQL + Redis**: PostgreSQL handles relational data (users, orders, appointments, bookings). Redis provides session caching, real-time presence tracking, and a job queue for retry logic (notifications, payment callbacks).

**AWS S3 for Media**: Portfolio images, vendor listing images, and marketer videos are stored in S3 with CloudFront CDN for fast delivery. Pre-signed URLs allow direct client uploads without routing large files through the backend.

---

## Technology Stack

| Concern | Library / Service |
|---|---|
| Framework | React Native 0.74+ |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| State Management | Zustand 4 |
| HTTP Client | Axios (with interceptors for JWT refresh) |
| Real-time Messaging | Socket.IO client (`socket.io-client`) |
| Push Notifications | `expo-notifications` (FCM on Android, APNs on iOS) |
| Image Caching | `expo-image` (built-in memory + disk cache) |
| Performance Lists | `@shopify/flash-list` (replaces FlatList for feed/marketplace) |
| Internationalization | `react-i18next` + `expo-localization` |
| Secure Storage | `expo-secure-store` (JWT tokens) |
| Form Validation | `react-hook-form` + `zod` |
| Media Upload | `expo-image-picker` + `expo-video` |
| Calendar Rendering | `react-native-calendars` (planner calendar view) |
| File Upload (Workspace) | `expo-document-picker` + pre-signed S3 URLs |
| Accessibility | React Native built-in `accessibilityLabel` + `accessible` props |
| Testing (Unit) | Jest + React Native Testing Library |
| Testing (Property) | `fast-check` (property-based testing) |
| Backend | NestJS (Node.js + TypeScript) |
| Database | PostgreSQL 15 (via TypeORM) |
| Cache / Queues | Redis 7 (via BullMQ for job queues) |
| Media Storage | AWS S3 + CloudFront CDN |
| AI Outfit Generation | OpenAI GPT-4o / DALL-E 3 (via backend proxy) |
| Payment | MTN MoMo API (Collections product) + Orange Money API |
| Push Delivery | Firebase Cloud Messaging (Android) + APNs (iOS) |

---

## Components and Interfaces

### Client-Side Module Map

```
src/
├── navigation/
│   ├── RootNavigator.tsx          # Auth gate: Guest / Auth / Onboarding
│   ├── AuthNavigator.tsx          # Login, Register stack
│   ├── ClientTabs.tsx             # Feed | Designers | Marketplace | Chat
│   ├── DesignerTabs.tsx           # Appointments | Portfolio | Marketers | Summary
│   ├── VendorTabs.tsx             # Catalog | Orders | Delivery
│   ├── MarketerTabs.tsx           # Portfolio | Bookings | History
│   └── GuestNavigator.tsx         # Feed (read-only) | Marketplace (read-only)
├── screens/
│   ├── auth/                      # Login, Register, PinSetup
│   ├── feed/                      # InspirationFeed, ImageDetail, OutfitGenerator
│   ├── designers/                 # DesignerDirectory, DesignerProfile
│   ├── marketplace/               # Marketplace, ListingDetail, Cart, Checkout
│   ├── chat/                      # ConversationList, ChatThread
│   ├── appointments/              # AppointmentList, AppointmentDetail
│   ├── portfolio/                 # PortfolioGrid, ImageUpload
│   ├── marketers/                 # MarketerDirectory, MarketerProfile, BookingForm
│   ├── vendor/                    # CatalogManager, ListingForm, OrderList
│   ├── notifications/             # NotificationCenter
│   ├── settings/                  # LanguagePicker, ProfileEdit
│   ├── training/                  # TrainingDirectory, TrainingProgramDetail, TrainingProgramForm, ApplicationList, TrainingApplicationStatus
│   ├── planner/                   # PlannerCalendar, DayDetail, AddEvent
│   └── collaboration/             # CollaborationList, CollaborationDetail, CollaborationWorkspace, InviteDesigner
├── components/
│   ├── ui/                        # Button, Input, Badge, Avatar, Card, Banner
│   ├── feed/                      # FeedItem, FeedGrid, EndOfFeedIndicator
│   ├── designer/                  # DesignerCard, RankingStars, AvailabilityBadge
│   ├── chat/                      # MessageBubble, ReadReceipt, AttachmentPicker
│   ├── payment/                   # PaymentMethodSelector, PaymentStatus
│   └── layout/                   # SafeArea, KeyboardAvoid, LoadingOverlay
├── stores/
│   ├── authStore.ts               # session, user, login/logout actions
│   ├── feedStore.ts               # feed items, cursor, loading state
│   ├── cartStore.ts               # items, addItem, removeItem, clear
│   ├── chatStore.ts               # conversations, messages, socket status
│   ├── notificationStore.ts       # notifications, unread count
│   ├── uiStore.ts                 # language, theme, toast queue
│   ├── trainingStore.ts           # training programs, applications, enrollment state
│   ├── plannerStore.ts            # calendar events, custom events, day notes
│   └── collaborationStore.ts      # collaboration projects, invitations, workspace content
├── services/
│   ├── apiClient.ts               # Axios instance, JWT interceptor, refresh
│   ├── socketClient.ts            # Socket.IO singleton, event handlers
│   ├── notificationService.ts     # Register token, handle foreground/background
│   └── mediaUploadService.ts      # Pre-signed URL upload to S3
├── i18n/
│   ├── en.json                    # All English strings
│   ├── fr.json                    # All French strings
│   └── i18n.ts                   # react-i18next configuration
└── theme/
    ├── colors.ts                  # Afrocentric palette tokens
    ├── typography.ts              # Font scales
    └── spacing.ts                 # 4-pt grid spacing
```

### Key Component Interfaces

#### AuthStore (Zustand)
```typescript
interface AuthStore {
  user: User | null;
  sessionToken: string | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (phone: string, credential: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  failedAttempts: number;
  lockedUntil: Date | null;
}
```

#### CartStore (Zustand)
```typescript
interface CartStore {
  items: CartItem[];
  addItem: (listing: Listing) => void;
  removeItem: (listingId: string) => void;
  clear: () => void;
  total: number;           // derived
  itemCount: number;       // derived — count of distinct items
}
```

#### ChatStore (Zustand)
```typescript
interface ChatStore {
  conversations: Conversation[];
  activeMessages: Message[];
  socketStatus: 'connected' | 'reconnecting' | 'disconnected';
  sendMessage: (conversationId: string, content: MessageContent) => Promise<void>;
  openConversation: (designerId: string) => Promise<void>;
  markRead: (messageId: string) => void;
}
```

#### FeedStore (Zustand)
```typescript
interface FeedStore {
  items: FeedItem[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  lastScrollPosition: number;
  fetchNextBatch: () => Promise<void>;
  reset: () => void;
}
```

---

## Data Models

### User
```typescript
interface User {
  id: string;                         // UUID
  fullName: string;                   // 1–100 chars
  phone: string;                      // E.164 format: +237XXXXXXXXX
  location: string;                   // city or region, 1–100 chars
  role: 'Client' | 'Designer' | 'Vendor' | 'Marketer';
  marketerSubRole?: 'Model' | 'Content_Creator';
  passwordHash: string;
  pinHash?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  pushToken?: string;                 // FCM/APNs device token
  createdAt: Date;
  updatedAt: Date;
}
```

### Designer
```typescript
interface Designer {
  id: string;                         // UUID, FK → User.id
  portfolioImages: PortfolioImage[];  // max 50
  rankingScore: number;               // 0.0–5.0, arithmetic mean of reviews
  reviewCount: number;
  availability: 'Available' | 'Busy' | 'Unavailable';
  completedFitsCount: number;
  pendingAppointmentsCount: number;
  location: string;
}

interface PortfolioImage {
  id: string;
  url: string;                        // S3 URL
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;                  // ≤ 10MB
  uploadedAt: Date;
}
```

### Vendor
```typescript
interface Vendor {
  id: string;                         // UUID, FK → User.id
  storeName: string;
  location: string;
}

interface Listing {
  id: string;
  vendorId: string;
  name: string;                       // 1–100 chars
  category: 'clothes' | 'accessories' | 'shoes' | 'hairstyle_products_services';
  description: string;                // 1–1000 chars
  price: number;                      // 0.01–999999.99 XAF
  images: ListingImage[];             // 1–10, each ≤ 5MB
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ListingImage {
  id: string;
  url: string;
  sizeBytes: number;                  // ≤ 5MB
}
```

### Marketer
```typescript
interface Marketer {
  id: string;                         // UUID, FK → User.id
  subRole: 'Model' | 'Content_Creator';
  portfolioFiles: MarketerFile[];     // max 50
  bookingStatus: 'Available' | 'Booked';
  location: string;
}

interface MarketerFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  mimeType: string;
  sizeBytes: number;                  // images ≤10MB, videos ≤200MB
  durationSeconds?: number;           // video only, ≤ 300s
}
```

### Order
```typescript
interface Order {
  id: string;
  clientId: string;
  vendorId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;                      // 1–10,000,000 XAF
  paymentMethod: 'mtn_momo' | 'orange_money';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentReference?: string;
  deliveryStatus: 'Pending' | 'In Transit' | 'Delivered';
  deliveryReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  listingId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}
```

### Appointment
```typescript
interface Appointment {
  id: string;
  clientId: string;
  designerId: string;
  status: 'Pending' | 'Attended' | 'Unattended' | 'Delivered';
  requestedAt: Date;
  attendedAt?: Date;                  // set when Designer marks Attended
  deliveredAt?: Date;                 // set when Designer marks Delivered
  notes?: string;
}
```

### Booking
```typescript
interface Booking {
  id: string;
  designerId: string;
  marketerId: string;
  designerName: string;
  description: string;                // ≤ 500 chars
  proposedStartDate: Date;
  proposedEndDate: Date;
  status: 'Pending' | 'Confirmed' | 'Declined' | 'Failed';
  notificationAttempts: number;       // 0–3
  createdAt: Date;
}
```

### Message
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image';
  content: string;                    // text: ≤2000 chars; image: S3 URL
  deliveryStatus: 'Sending' | 'Delivered' | 'Read' | 'Failed';
  retryCount: number;                 // 0–3
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

interface Conversation {
  id: string;
  clientId: string;
  designerId: string;
  lastMessage?: Message;
  createdAt: Date;
}
```

### Notification
```typescript
interface Notification {
  id: string;
  recipientId: string;
  recipientRole: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;       // deep-link payload
  channel: 'push' | 'in_app' | 'both';
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

type NotificationType =
  | 'appointment_request'
  | 'appointment_status_update'
  | 'order_placed'
  | 'order_status_update'
  | 'booking_request'
  | 'booking_response'
  | 'new_message';
```

### Review
```typescript
interface Review {
  id: string;
  designerId: string;
  clientId: string;
  score: number;                      // 1–5 integer
  createdAt: Date;
}
```

---

### TrainingProgram
```typescript
interface TrainingProgram {
  id: string;
  designerId: string;
  title: string;                    // 1–150 chars
  description: string;              // 1–2000 chars
  durationCategory: 'short-term' | 'long-term';
  startDate: Date;                  // >= submission date
  maxCapacity: number;              // 1–500
  enrolledCount: number;
  price: number;                    // 1–10,000,000 XAF
  timetable: string;                // 1–5000 chars
  status: 'Draft' | 'Published' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### TrainingApplication
```typescript
interface TrainingApplication {
  id: string;
  programId: string;
  clientId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  paymentReference: string;
  appliedAt: Date;
  respondedAt?: Date;
}
```

### PlannerEvent
```typescript
interface PlannerEvent {
  id: string;
  designerId: string;
  title: string;                    // 1–200 chars
  date: Date;
  note?: string;                    // 1–1000 chars (day note, stored per-date)
  type: 'custom';
  createdAt: Date;
}
```

### CollaborationProject
```typescript
interface CollaborationProject {
  id: string;
  creatorId: string;
  title: string;                    // 1–150 chars
  description: string;              // 1–2000 chars
  requiredSkills: string;           // 1–500 chars
  deadline: Date;                   // >= creation date
  collaboratorSlots: number;        // 1–20
  participants: string[];           // array of Designer user IDs
  status: 'Active' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### CollaborationInvitation
```typescript
interface CollaborationInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeId: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  sentAt: Date;
  respondedAt?: Date;
}
```

### WorkspaceNote
```typescript
interface WorkspaceNote {
  id: string;
  projectId: string;
  authorId: string;
  content: string;                  // 1–2000 chars
  createdAt: Date;
}
```

### WorkspaceFile
```typescript
interface WorkspaceFile {
  id: string;
  projectId: string;
  uploaderId: string;
  url: string;                      // S3 URL
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  sizeBytes: number;                // <= 10,485,760 bytes (10 MB)
  uploadedAt: Date;
}
```

### WorkspaceUpdate
```typescript
interface WorkspaceUpdate {
  id: string;
  projectId: string;
  authorId: string;
  content: string;                  // 1–1000 chars
  createdAt: Date;
}
```

---

## API Design

All endpoints are prefixed `/api/v1`. Authentication uses Bearer JWT tokens. Guest requests carry no token and access read-only endpoints.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account; body: `{ fullName, phone, location, role, marketerSubRole?, password, pin? }` |
| POST | `/auth/login` | Login; body: `{ phone, password? or pin? }` → returns `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | Refresh access token; body: `{ refreshToken }` |
| POST | `/auth/logout` | Invalidate session |

### Inspiration Feed

| Method | Endpoint | Description |
|---|---|---|
| GET | `/feed?cursor=&limit=10` | Paginated feed items |
| GET | `/feed/:id` | Single feed item detail (tags, image URL) |
| GET | `/feed/:id/designers?location=` | Designers matching client's location for "Send to Designer" |

### Designer Discovery

| Method | Endpoint | Description |
|---|---|---|
| GET | `/designers?location=&sort=ranking&q=&cursor=` | Filtered/searched designer list |
| GET | `/designers/:id` | Designer profile (portfolio up to 20 images, ranking, availability) |
| PATCH | `/designers/:id/availability` | Toggle availability (Designer only) |
| POST | `/designers/:id/portfolio` | Upload portfolio image (multipart or pre-signed URL) |
| DELETE | `/designers/:id/portfolio/:imageId` | Remove portfolio image |
| GET | `/designers/:id/appointments` | Appointment list for a Designer |
| PATCH | `/appointments/:id/status` | Update appointment status (Attended / Delivered) |

### Marketer Directory

| Method | Endpoint | Description |
|---|---|---|
| GET | `/marketers?subRole=&location=&cursor=` | Filtered marketer list (up to 100/page) |
| GET | `/marketers/:id` | Marketer full profile |
| POST | `/marketers/:id/bookings` | Submit booking request (Designer only) |
| PATCH | `/bookings/:id/respond` | Accept or decline a booking (Marketer only) |

### Vendor / Marketplace

| Method | Endpoint | Description |
|---|---|---|
| GET | `/marketplace?category=&location=&cursor=` | Browse all listings |
| GET | `/marketplace/:id` | Listing detail |
| POST | `/vendor/listings` | Create listing (Vendor only) |
| PATCH | `/vendor/listings/:id` | Update listing (price, availability, images) |
| GET | `/vendor/orders` | Active orders for vendor |

### Cart & Orders

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Confirm order from cart; body: `{ items, paymentMethod }` |
| GET | `/orders/:id` | Order detail and delivery status |
| PATCH | `/orders/:id/delivery` | Update delivery status (Vendor/Delivery system) |

### Payment

| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/initiate` | Start payment; body: `{ orderId, method, amount }` |
| POST | `/payments/callback` | Provider webhook (internal; verifies signature) |
| GET | `/payments/:transactionRef` | Transaction status |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| GET | `/conversations` | List conversations for authenticated user |
| GET | `/conversations/:id/messages?cursor=` | Paginated message history |
| POST | `/conversations` | Initiate conversation; body: `{ designerId }` |

Real-time events over Socket.IO:

| Event (emit) | Payload | Description |
|---|---|---|
| `message:send` | `{ conversationId, type, content }` | Send a message |
| `message:read` | `{ messageId }` | Mark message as read |

| Event (on) | Payload | Description |
|---|---|---|
| `message:new` | `Message` | Incoming message |
| `message:delivered` | `{ messageId }` | Delivery confirmation |
| `message:read` | `{ messageId }` | Read receipt from recipient |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications?cursor=` | In-app notification list |
| PATCH | `/notifications/:id/read` | Mark notification as read |
| POST | `/devices/token` | Register/update push token |

### AI Outfit Generator

| Method | Endpoint | Description |
|---|---|---|
| POST | `/outfit/generate` | Body: `{ prompt }` (1–500 chars); returns concept text + image URL |

---

### Training Programs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/training-programs?durationCategory=&location=&cursor=` | Browse published programs with optional filters |
| GET | `/training-programs/:id` | Program detail (title, description, timetable, remaining slots, price) |
| POST | `/designers/:id/training-programs` | Create a Training_Program (Designer only) |
| PATCH | `/training-programs/:id` | Update timetable or other program fields (Designer/owner only) |
| POST | `/training-programs/:id/apply` | Client applies — triggers Payment_Gateway first; creates application on success |
| GET | `/training-programs/:id/applications` | List all applications for a program (Designer/owner only) |
| PATCH | `/training-applications/:id/respond` | Accept or reject an application (Designer/owner only); body: `{ decision: 'accept' \| 'reject' }` |

### Designer Planner

| Method | Endpoint | Description |
|---|---|---|
| GET | `/designers/:id/planner?from=&days=30` | Consolidated planner events for a date range (training sessions, appointments, deliveries, custom events) |
| POST | `/designers/:id/planner/events` | Create a custom planner event; body: `{ title, date }` |
| PATCH | `/designers/:id/planner/events/:eventId` | Update a custom event (title or date) |
| DELETE | `/designers/:id/planner/events/:eventId` | Delete a custom event |
| POST | `/designers/:id/planner/notes` | Add or update a day note; body: `{ date, note }` (1–1000 chars) |

### Collaboration

| Method | Endpoint | Description |
|---|---|---|
| POST | `/designers/:id/collaborations` | Create a Collaboration_Project (Designer only) |
| GET | `/designers/:id/collaborations` | List all projects the designer created or participates in |
| GET | `/collaborations/:id` | Project detail (title, description, participants, deadline, status) |
| POST | `/collaborations/:id/invite` | Send invitation to another designer; body: `{ inviteeId }` |
| PATCH | `/collaboration-invitations/:id/respond` | Accept or decline an invitation; body: `{ decision: 'accept' \| 'decline' }` |
| GET | `/collaborations/:id/workspace/notes` | List shared text notes for a project |
| POST | `/collaborations/:id/workspace/notes` | Add a shared note; body: `{ content }` (1–2000 chars) |
| GET | `/collaborations/:id/workspace/files` | List uploaded files for a project |
| POST | `/collaborations/:id/workspace/files` | Request pre-signed S3 URL for file upload; body: `{ filename, mimeType, sizeBytes }` |
| GET | `/collaborations/:id/workspace/updates` | List progress updates for a project |
| POST | `/collaborations/:id/workspace/updates` | Post a progress update; body: `{ content }` (1–1000 chars) |

---

## Navigation Structure

```
RootNavigator
├── Onboarding (first launch)
│   └── LanguagePicker
├── AuthNavigator (unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
├── GuestNavigator (no session, no sign-in)
│   ├── GuestFeedTab
│   │   ├── InspirationFeed (read-only)
│   │   └── ImageDetail (no action buttons)
│   ├── GuestMarketplaceTab
│   │   ├── Marketplace (read-only)
│   │   └── ListingDetail (no Add to Cart)
│   └── SignInPromptModal (triggered by restricted action)
├── ClientTabs (Bottom Tab)
│   ├── FeedStack
│   │   ├── InspirationFeed
│   │   ├── ImageDetail → OutfitGenerator | SendToDesigner
│   │   └── OutfitGeneratorResult
│   ├── DesignersStack
│   │   ├── DesignerDirectory
│   │   └── DesignerProfile → ChatThread
│   ├── MarketplaceStack
│   │   ├── Marketplace
│   │   ├── ListingDetail
│   │   ├── Cart
│   │   └── Checkout → OrderConfirmation
│   ├── ChatStack
│   │   ├── ConversationList
│   │   └── ChatThread
│   └── TrainingStack (Client)
│       ├── TrainingDirectory
│       ├── TrainingProgramDetail
│       └── TrainingApplicationStatus
├── DesignerTabs (Bottom Tab)
│   ├── AppointmentsStack
│   │   ├── AppointmentList
│   │   └── AppointmentDetail
│   ├── PortfolioStack
│   │   ├── PortfolioGrid
│   │   └── ImageUpload
│   ├── MarketersStack
│   │   ├── MarketerDirectory
│   │   ├── MarketerProfile
│   │   └── BookingForm
│   ├── TrainingStack (Designer)
│   │   ├── TrainingProgramList
│   │   ├── TrainingProgramForm
│   │   └── ApplicationList
│   ├── PlannerStack
│   │   ├── PlannerCalendar
│   │   ├── DayDetail
│   │   └── AddEvent
│   ├── CollaborationStack
│   │   ├── CollaborationList
│   │   ├── CollaborationDetail
│   │   ├── CollaborationWorkspace
│   │   └── InviteDesigner
│   └── DashboardSummary
├── VendorTabs (Bottom Tab)
│   ├── CatalogStack
│   │   ├── CatalogList
│   │   └── ListingForm (create/edit)
│   ├── OrdersStack
│   │   ├── OrderList
│   │   └── OrderDetail
│   └── DeliveryStack
│       └── DeliveryTracking
└── MarketerTabs (Bottom Tab)
    ├── PortfolioStack
    │   ├── MarketerPortfolioGrid
    │   └── MediaUpload
    ├── BookingsStack
    │   ├── PendingBookings
    │   └── BookingDetail
    └── HistoryStack
        └── BookingHistory
```

Deep-link format for notification taps: `cfashion://screen?params`

---

## Key Component Designs

### Authentication Flow

```
App Launch
    │
    ▼
restoreSession() ──── token in SecureStore? ──── YES ──► validate token
    │                                                          │
    NO                                              valid? ──── YES ──► RoleDashboard
    │                                                  │
    ▼                                                  NO
GuestNavigator                                         │
    │                                              AuthNavigator
    ▼
User taps "Sign In / Sign Up"
    │
    ▼
LoginScreen
├── Phone + Password → POST /auth/login
├── Phone + PIN → POST /auth/login
└── Success → store tokens in expo-secure-store → navigate to RoleDashboard
```

Failed login tracking is stored in the `authStore` (client-side counter backed by server-side lockout state). The server returns HTTP 423 with `lockedUntil` timestamp when the account is locked.

Password/PIN minimum requirements are enforced client-side with Zod and re-validated server-side.

### Inspiration Feed Component

The feed uses `@shopify/flash-list` with a two-column masonry-style layout. Each `FeedItem` renders a `FastImage`-equivalent (via `expo-image`) with aggressive disk + memory caching.

```
InspirationFeed
├── FlashList
│   ├── renderItem: FeedItem (image + style tags chip row)
│   ├── onEndReached: feedStore.fetchNextBatch()
│   ├── onEndReachedThreshold: 0.3
│   └── ListFooterComponent: LoadingSpinner | EndOfFeedIndicator
└── onScroll: feedStore.setScrollPosition()  (persisted for guest→auth restore)

FeedItem → tap → ImageDetailSheet (bottom sheet)
├── Full image (pinch-to-zoom)
├── Style tags
├── "Send to Designer" button (hidden in guest mode)
└── "Generate Outfit" button (hidden in guest mode)
```

### Chat Component (Real-Time Messaging)

```
ChatThread
├── FlashList (inverted, newest at bottom)
│   └── MessageBubble
│       ├── Text or Image content
│       ├── Timestamp (minute precision)
│       └── ReadReceipt (Delivered → Read)
├── MessageInput
│   ├── TextInput (maxLength: 2000)
│   ├── AttachmentButton → expo-image-picker (max 10MB)
│   └── SendButton → socketClient.emit('message:send', ...)
└── ConnectionStatusBanner (shown when socket disconnected)
```

Message retry logic in `chatStore`:
1. On send failure, increment `retryCount`.
2. Schedule retry at 5-second intervals using `setTimeout`.
3. After 3 failed retries, mark message as `Failed` and show indicator.

### Payment Flow

```
Cart → Checkout
    │
    ▼
OrderSummary screen
├── Item list + quantities + prices
├── Subtotal + delivery fee
└── PaymentMethodSelector (MTN MoMo | Orange Money)
    │
    ▼
Client confirms → POST /orders
    │
    ▼
Backend: validate amount (1–10,000,000 XAF), create pending Order
    │
    ▼
POST /payments/initiate → Payment Gateway Module
    │
    ├── Sends request to MTN MoMo / Orange Money API over TLS
    ├── Awaits response max 30 seconds
    │
    ├── SUCCESS → record transaction → update Order.paymentStatus = 'Paid'
    │             → notify Vendor (BullMQ job) → return order ref to client
    │
    └── FAILURE / TIMEOUT → rollback Order to 'Pending'
                          → return failure reason to client
                          → client shows error, cart preserved
```

### Outfit Generator Component

```
OutfitGeneratorScreen
├── TextInput (maxLength: 500, character counter)
├── GenerateButton
│   └── onPress → POST /outfit/generate
├── LoadingState (timeout: 10s)
├── ResultView
│   ├── Generated concept text
│   ├── Generated image (if available)
│   ├── "Send to Designer" button
│   └── "Save to Profile" button
└── ErrorState
    ├── Error message
    └── RetryButton (resubmits same prompt, no re-entry needed)
```

The backend proxies the AI request to OpenAI (GPT-4o for concept text, DALL-E 3 for image generation). A 10-second client-side timeout cancels the in-flight request and triggers the error state.

---

## State Management

Zustand stores are organized by domain. Each store is a self-contained slice with state and actions:

```typescript
// Example: authStore
const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      sessionToken: null,
      isGuest: false,
      failedAttempts: 0,
      lockedUntil: null,
      login: async (phone, credential) => { /* ... */ },
      logout: async () => { /* clear SecureStore, reset state */ },
      restoreSession: async () => { /* read SecureStore, validate token */ },
    }),
    { name: 'auth', storage: createSecureStorage() }
  )
);
```

Sensitive tokens (JWT access + refresh) are persisted in `expo-secure-store` via a custom Zustand persist storage adapter. Non-sensitive UI state (language, theme) is persisted in AsyncStorage.

**Derived state** (cart total, unread notification count) is computed inline in the store using Zustand's `get()` rather than separate selectors, keeping subscriptions granular.

**Server state** (feed items, designer lists, marketplace listings) is managed in Zustand stores but populated via Axios calls. There is no separate React Query layer — the stores own the async lifecycle (loading, error, data). This keeps the dependency count low for a mobile target where bundle size matters.

---

## Security Considerations

### Session Management
- Access tokens (JWT, 15-minute expiry) stored in `expo-secure-store` (iOS Keychain / Android Keystore).
- Refresh tokens (7-day expiry) stored in `expo-secure-store`.
- Axios interceptor transparently refreshes the access token on 401 responses.
- On logout, both tokens are deleted from SecureStore and the refresh token is revoked server-side (stored in Redis with expiry).

### Account Lockout
- Server tracks `failedLoginAttempts` in PostgreSQL per user.
- After 5 consecutive failures, `lockedUntil` is set to `now + 15 minutes`.
- Server returns HTTP 423 with the lockout expiry; client shows the duration.
- Lockout counter resets on successful login.

### Payment Security
- All payment API calls go over TLS (enforced at the NestJS HTTP module level with `httpsAgent` enforcing TLS 1.2+).
- Payment amounts are validated server-side (1–10,000,000 XAF) before any provider API call.
- Provider webhook callbacks are verified using HMAC signature validation.
- No raw card or payment credentials are stored; only transaction references.

### Input Validation
- All user inputs are validated client-side with Zod schemas before API submission.
- All inputs are re-validated server-side (NestJS class-validator pipes).
- File uploads are validated by MIME type and byte size on the backend before S3 write.
- Text fields are sanitized to prevent XSS (though the primary surface is a mobile app, the backend API may serve web clients in future).

### Role-Based Access Control
- NestJS Guards enforce role checks on every protected route.
- The JWT payload includes `{ sub: userId, role, marketerSubRole? }`.
- Guest requests carry no token; public endpoints are explicitly whitelisted.

### Media Upload Security
- Clients request a pre-signed S3 URL from the backend (valid for 5 minutes).
- The backend enforces allowed MIME types and max size in the pre-signed URL policy.
- S3 bucket is private; CloudFront distribution serves media with signed URLs.

---

## Performance Considerations

### Pagination & Infinite Scroll
- All list endpoints use cursor-based pagination (opaque cursor string, not page numbers), avoiding the "offset drift" problem when items are inserted or deleted.
- Feed and marketplace fetch batches of 10 items minimum.
- `FlashList` is used instead of `FlatList` for all long lists — it recycles item views on the native thread, significantly reducing JS thread pressure on mid-range Android devices.

### Image Caching
- `expo-image` provides automatic two-level caching (memory LRU + disk) with proper CDN `Cache-Control` header respect.
- Thumbnail images for the feed, designer directory, and marketer directory are served from CloudFront at reduced dimensions (via S3 image transforms or a separate thumbnail generation Lambda).
- Portfolio images are lazy-loaded only when the user navigates to a profile.

### Real-Time Messaging
- Socket.IO is configured with `transports: ['websocket']` to skip the HTTP long-polling handshake on mobile.
- The socket connection is managed as a singleton in `socketClient.ts`. It reconnects automatically with exponential backoff when the app returns to the foreground.
- Message history is fetched via REST (cursor-paginated) on conversation open; only new messages are delivered over the socket.

### Network Resilience
- Axios is configured with a 30-second timeout for standard API calls and a 60-second timeout for file uploads.
- BullMQ on the backend handles async jobs (notification delivery, payment callbacks) with retry logic, preventing blocking the main request cycle.
- Offline detection uses NetInfo; the UI shows a connection banner when offline and queues outgoing chat messages for retry.

### App Startup
- Session restoration (`restoreSession()`) reads from SecureStore (native, synchronous-equivalent) and validates the token in a single API call, targeting < 3 seconds to dashboard display on re-launch.
- Navigation state is not persisted; deep links from notifications reconstruct the target screen directly.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The properties below are derived from the prework analysis of all acceptance criteria. Each property is universally quantified and implemented using `fast-check` for property-based testing with a minimum of 100 iterations per test.

**Property reflection notes**: Several pairs of properties from the prework were consolidated:
- Field-presence rendering properties for Designer Directory (4.1) and Designer Profile (4.6) are unified into a single "profile fields completeness" pattern but kept separate because they test different data shapes.
- Out-of-stock Cart blocking (7.5 and 8.4) are separate but complementary — kept as one property covering both listing and cart perspectives.
- Guest mode restriction properties (13.2, 13.3, 13.4, 13.5) are unified into a single "guest access invariant" property that covers all restricted feature exclusions.
- Session persistence (1.10 and 1.11) unified into one property.

---

### Property 1: Registration field validation — valid inputs accepted, invalid inputs rejected

*For any* combination of registration field values, the validation function SHALL accept the combination if and only if: `fullName` is 1–100 characters, `phone` matches E.164 format (`+237` followed by 9 digits), `location` is 1–100 characters, and `role` is one of the four valid roles. Any combination with a field outside these constraints SHALL be rejected with an inline error, and no account SHALL be created.

**Validates: Requirements 1.1, 1.3**

---

### Property 2: Duplicate phone number always rejected

*For any* phone number that is already associated with an existing user account in the system, submitting a registration request with that phone number SHALL always return an error on the phone field and SHALL NOT create a second account.

**Validates: Requirements 1.4**

---

### Property 3: Invalid credentials produce generic error message

*For any* phone number and credential pair that does not match a valid account, the login response SHALL always return the generic error "Invalid phone number or password" and SHALL NOT reveal whether the phone number exists in the system.

**Validates: Requirements 1.8**

---

### Property 4: Session persistence invariant

*For any* successfully authenticated session where the user has not explicitly logged out, relaunching the app SHALL result in the user being navigated directly to their role-specific dashboard without requiring re-authentication, as long as the session token remains valid and unexpired.

**Validates: Requirements 1.10, 1.11**

---

### Property 5: Inspiration Feed batch size invariant

*For any* call to the feed API that returns a non-empty response (i.e., items are still available), the batch size SHALL be at least 10 items. When no more items are available, the response SHALL indicate end-of-feed rather than returning an empty non-terminal batch.

**Validates: Requirements 3.1, 3.9**

---

### Property 6: Send-to-Designer returns only location-matched designers

*For any* client location value and any designer database, the designers returned by the "Send to Designer" lookup SHALL contain only designers whose registered `location` matches the client's `location`. No designer from a non-matching location SHALL appear in the results.

**Validates: Requirements 3.3**

---

### Property 7: Outfit Generator prompt validation

*For any* string submitted as an outfit generation prompt, the system SHALL accept it if and only if its character length is between 1 and 500 (inclusive). Empty strings and strings exceeding 500 characters SHALL be rejected with a validation error, and no AI request SHALL be dispatched for invalid prompts.

**Validates: Requirements 3.4, 3.5**

---

### Property 8: Designer directory location filter exclusivity

*For any* location filter value applied to the Designer Directory, all returned designer entries SHALL have a `location` field matching the filter value. No entry with a non-matching location SHALL appear in the filtered results.

**Validates: Requirements 4.2**

---

### Property 9: Designer directory ranking sort is monotonically non-increasing

*For any* list of designers returned with the ranking sort applied, for every adjacent pair of designers (D[i], D[i+1]) in the result, `D[i].rankingScore >= D[i+1].rankingScore` SHALL hold. Among designers with equal ranking scores, the one most recently active SHALL appear first.

**Validates: Requirements 4.3**

---

### Property 10: Designer and Marketer profile rendering completeness

*For any* designer profile record, rendering it SHALL produce output containing: name, location, ranking score (formatted on 0.0–5.0 scale), and availability status. *For any* marketer profile entry in the directory, rendering it SHALL produce output containing: name, sub-role, location, and a portfolio thumbnail.

**Validates: Requirements 4.1, 4.6, 6.2**

---

### Property 11: Portfolio file upload validation

*For any* file submitted for upload to a Designer or Marketer portfolio, the validation function SHALL:
- Accept the file if its MIME type is `image/jpeg`, `image/png`, or `image/webp` AND its size is ≤ 10,485,760 bytes (10 MB)
- Reject the file if its MIME type is not one of the accepted types OR its size exceeds 10 MB
- For Marketer video uploads: accept if MIME type is a video type AND size ≤ 209,715,200 bytes (200 MB) AND duration ≤ 300 seconds
- Never store a rejected file

**Validates: Requirements 5.1, 5.3, 6.8**

---

### Property 12: Appointment status transition validity

*For any* appointment, the transition to "Delivered" status SHALL succeed if and only if the appointment's current status is "Attended". For any appointment in any other status (Pending, Unattended, or already Delivered), attempting the transition to Delivered SHALL return an error and leave the appointment status unchanged.

**Validates: Requirements 5.7**

---

### Property 13: Appointment Attended transition records timestamp

*For any* appointment that is marked as "Attended", the resulting appointment record SHALL have a non-null `attendedAt` timestamp that is greater than or equal to the appointment's `requestedAt` timestamp, and the status SHALL be "Attended".

**Validates: Requirements 5.6**

---

### Property 14: Ranking score is arithmetic mean of all reviews

*For any* non-empty sequence of review scores (each in the range 1–5), the designer's computed ranking score SHALL equal the arithmetic mean of all submitted review scores, rounded to one decimal place. Adding a new review SHALL immediately update the ranking to reflect the new mean.

**Validates: Requirements 5.9**

---

### Property 15: Marketer directory filter correctness

*For any* combination of sub-role filter (`Model` or `Content_Creator`) and location filter, all returned marketer profiles SHALL match both filter criteria simultaneously. A marketer whose sub-role or location does not match the active filter(s) SHALL NOT appear in the results.

**Validates: Requirements 6.1**

---

### Property 16: Notification retry — exactly 3 attempts before Failed

*For any* notification that encounters delivery failure on the first attempt, the notification system SHALL retry delivery exactly 3 more times (total 4 attempts: 1 initial + 3 retries) at 60-second intervals before marking the notification as "Failed" and logging the error. The retry count in the notification record SHALL accurately reflect the number of attempts made.

**Validates: Requirements 6.5**

---

### Property 17: Active Confirmed booking blocks new booking requests

*For any* marketer whose current booking status is "Booked" (i.e., has an active Confirmed booking), any new booking request submitted to that marketer SHALL be rejected by the system. The rejection SHALL occur regardless of the requesting designer's identity or the content of the booking request.

**Validates: Requirements 6.9**

---

### Property 18: Vendor listing field validation

*For any* vendor listing submission, the validation function SHALL accept the listing if and only if: `name` is 1–100 characters, `category` is one of the four valid values, `description` is 1–1,000 characters, `price` is in the range 0.01–999,999.99 XAF, and the images array contains 1–10 images each ≤ 5,242,880 bytes (5 MB). Any submission violating any constraint SHALL be rejected with an inline error on the offending field, and no listing SHALL be saved.

**Validates: Requirements 7.1, 7.2**

---

### Property 19: Out-of-stock items cannot be added to cart

*For any* marketplace listing where `inStock` is `false`, any attempt to add that listing to the cart SHALL be rejected with an "Item unavailable" error, and the cart's contents SHALL remain unchanged after the rejection.

**Validates: Requirements 7.5, 8.4**

---

### Property 20: Marketplace category and location filter correctness

*For any* combination of category filter and vendor location filter applied to the Marketplace, all returned listings SHALL satisfy both active filters simultaneously. A listing whose category or vendor location does not match the filter SHALL NOT appear in the results.

**Validates: Requirements 8.1**

---

### Property 21: Payment failure preserves cart contents

*For any* cart contents at the time a payment failure occurs (provider failure or timeout), the cart's items, quantities, and selected payment method SHALL be identical before and after the failure. No item SHALL be removed from the cart as a result of a payment failure.

**Validates: Requirements 8.8**

---

### Property 22: Payment amount validation before provider contact

*For any* transaction amount submitted to the payment gateway, the gateway SHALL reject the transaction with a validation error and SHALL NOT contact the payment provider API if the amount is less than 1 XAF or greater than 10,000,000 XAF. Only amounts within [1, 10,000,000] XAF SHALL be forwarded to the provider.

**Validates: Requirements 9.7**

---

### Property 23: Confirmed payment records all required transaction fields

*For any* payment successfully confirmed by the provider, the stored transaction record SHALL contain all four required fields: transaction reference (non-empty string), amount (positive number within valid range), provider name ('mtn_momo' or 'orange_money'), and timestamp (valid ISO 8601 datetime within 5 seconds of confirmation).

**Validates: Requirements 9.4**

---

### Property 24: Payment timeout rolls back order to Pending

*For any* order that is in flight when the payment provider returns no response within 30 seconds or returns an explicit unreachable error, the order's `paymentStatus` SHALL be rolled back to "Pending", no funds SHALL be recorded as deducted, and the error SHALL be propagated to the client.

**Validates: Requirements 9.5**

---

### Property 25: Message validation — text length and image size

*For any* message submitted to the chat service, the message SHALL be accepted if and only if: for text messages, the content length is ≤ 2,000 characters; for image messages, the file size is ≤ 10,485,760 bytes (10 MB). Any message exceeding its respective limit SHALL be rejected with a validation error and SHALL NOT be sent.

**Validates: Requirements 10.4**

---

### Property 26: Message delivery retry — exactly 3 attempts before Failed indicator

*For any* message where initial delivery fails, the chat service SHALL retry delivery at 5-second intervals up to exactly 3 times. After all retries are exhausted (4 total attempts), the message SHALL be marked with a "Message not delivered" indicator. The retry count SHALL never exceed 3.

**Validates: Requirements 10.3**

---

### Property 27: Chat history chronological order invariant

*For any* sequence of messages stored in a conversation, retrieving the conversation history SHALL always return messages in strictly non-decreasing chronological order by `sentAt` timestamp. No retrieval operation SHALL return a message sequence where a later-sent message appears before an earlier-sent message.

**Validates: Requirements 10.7**

---

### Property 28: Notification payload completeness

*For any* triggering event (appointment request, order placed, booking request, etc.), the notification payload constructed by the Notification Service SHALL contain all fields required for that event type: for appointment requests — client name and requested date/time; for orders — Order ID and item name; for booking requests — designer name and proposed date range; for booking responses — marketer name and decision.

**Validates: Requirements 11.3, 11.4, 11.5, 11.6, 11.7, 11.8**

---

### Property 29: Translation completeness for all string keys

*For any* string key defined in the application's translation resource, both the English (`en`) and French (`fr`) translation values SHALL be non-empty strings. No key SHALL exist in the English resource without a corresponding non-empty French translation, and vice versa.

**Validates: Requirements 12.3**

---

### Property 30: Language defaulting logic correctness

*For any* device system language value, the application's first-launch language selection logic SHALL select that language if it is English or French (exact match), and SHALL default to English for any other system language value. The selected language SHALL be persisted for subsequent launches.

**Validates: Requirements 12.6**

---

### Property 31: Guest session access invariant

*For any* application state where the session is in guest mode (no authenticated user), the navigation options and rendered action buttons SHALL exclude all restricted features: Outfit Generator, Chat Service, Designer Directory, booking features, "Send to Designer", "Add to Cart", and checkout. Attempting to invoke any restricted feature SHALL trigger a sign-in/sign-up prompt. Only the Inspiration Feed (read-only) and Marketplace (read-only) SHALL be accessible.

**Validates: Requirements 13.2, 13.3, 13.4, 13.5**

---

### Property 32: Feed scroll position restored after guest authentication

*For any* scroll position recorded in the guest Inspiration Feed at the time the user initiates authentication, successfully completing authentication SHALL result in the Inspiration Feed being scrolled to that same position. The scroll restoration SHALL occur within the transition to the authenticated dashboard.

**Validates: Requirements 13.7**

---

### Property 33: Training Program field validation — valid inputs accepted, invalid inputs rejected

*For any* Training_Program submission, the validation function SHALL accept the submission if and only if all of the following constraints are simultaneously satisfied: `title` is 1–150 characters, `description` is 1–2,000 characters, `durationCategory` is exactly `'short-term'` or `'long-term'`, `startDate` is greater than or equal to the submission date, `maxCapacity` is an integer in the range 1–500, `price` is in the range 1–10,000,000 XAF, and `timetable` is 1–5,000 characters. Any submission where one or more fields violate these constraints SHALL be rejected with an inline error on each offending field and no Training_Program record SHALL be created.

**Validates: Requirements 14.1, 14.2**

---

### Property 34: Training enrollment capacity enforcement

*For any* Training_Program where `enrolledCount` equals `maxCapacity` (all slots filled), any attempt to accept a Training_Application for that program SHALL be rejected with an error and SHALL NOT update the Training_Application status, SHALL NOT increment `enrolledCount`, and SHALL NOT produce any side-effects on the program or application records.

**Validates: Requirements 14.9, 14.12**

---

### Property 35: Training application payment gate

*For any* Training_Application attempt, a Training_Application record SHALL NOT be created unless the Payment_Gateway first returns a confirmed successful transaction for the full program price. Any payment outcome other than explicit success — including provider failure, timeout, or partial payment — SHALL result in zero Training_Application records being created for that attempt.

**Validates: Requirements 14.6, 14.7, 14.8**

---

### Property 36: Planner conflict indicator correctness

*For any* designer's planner state and any given calendar day, the conflict indicator SHALL be displayed on that day if and only if the day contains at least one Training_Program session AND at least one appointment with status "Pending" or "Attended", or at least one outstanding delivery deadline (an "Attended" appointment not yet "Delivered"). A day containing only Training_Program sessions, or only appointments/delivery deadlines, SHALL NOT show a conflict indicator.

**Validates: Requirements 15.3**

---

### Property 37: Collaboration Project field validation — valid inputs accepted, invalid inputs rejected

*For any* Collaboration_Project submission, the validation function SHALL accept the submission if and only if all of the following constraints are simultaneously satisfied: `title` is 1–150 characters, `description` is 1–2,000 characters, `requiredSkills` is 1–500 characters, `deadline` is greater than or equal to the creation date, and `collaboratorSlots` is an integer in the range 1–20. Any submission where one or more fields violate these constraints SHALL be rejected with an inline error on each offending field and no Collaboration_Project record SHALL be created.

**Validates: Requirements 16.1, 16.2**

---

### Property 38: Collaboration slot exhaustion blocks invitations

*For any* Collaboration_Project where the current `participants` array length equals `collaboratorSlots` (all slots occupied), any attempt to send a collaboration invitation for that project SHALL be rejected with an error and SHALL NOT create a CollaborationInvitation record and SHALL NOT deliver any notification to the intended invitee.

**Validates: Requirements 16.7**

---

## Error Handling

### Client-Side Error Handling

| Scenario | Behavior |
|---|---|
| Network request timeout | Show toast with "Connection timed out" + Retry button |
| 401 Unauthorized | Axios interceptor refreshes token; if refresh fails, navigate to Login |
| 423 Account Locked | Show lockout message with remaining duration |
| 404 Resource Not Found | Show error screen, preserve prior navigation state (e.g., designer filters) |
| 500 Server Error | Show generic error banner; log to client-side error tracker |
| File upload failure | Show inline error with specific violation (bad format, too large) |
| Payment failure | Show failure reason, preserve cart, offer retry / alternative method |
| Socket disconnection | Show connection status banner; auto-reconnect with exponential backoff |
| Outfit Generator timeout | Show error after 10s, display Retry button pre-filled with original prompt |
| Language file unavailable | Retain previous language, show error notification |
| Dashboard data load failure | Show error banner with Retry; display last cached state if available |
| Profile load failure | Show error message; preserve designer directory filter state |

### Backend Error Handling

- All NestJS controllers use global exception filters that translate exceptions to standardized error responses: `{ statusCode, message, timestamp, path }`.
- Payment callbacks include HMAC signature verification; invalid signatures are rejected with HTTP 400 before any state changes.
- BullMQ jobs have dead-letter queues for permanently failed jobs (notifications, payment callbacks). Failed jobs are logged and alertable.
- Database transactions wrap multi-step operations (create order + payment record, appointment status transitions).
- TypeORM optimistic locking prevents race conditions on booking status updates and availability toggles.

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples, edge cases, and error conditions. Property-based tests cover universal properties across all valid inputs. Both are necessary for comprehensive correctness coverage.

### Unit Tests (Jest + React Native Testing Library)

Focus areas:
- Authentication flows: login, registration, session restore, lockout logic
- Form validation: field-level Zod schema validation for all input forms
- Navigation guards: correct screen rendered per role, guest mode gating
- Cart operations: add, remove, total calculation, out-of-stock rejection
- Chat message formatting: timestamp display, read receipt rendering
- Notification payload construction for each event type
- Payment amount validation boundary conditions (0, 1, 10,000,000, 10,000,001 XAF)
- Language defaulting logic for various device locale strings

### Property-Based Tests (fast-check, minimum 100 iterations each)

Each of the 38 Correctness Properties above is implemented as a single property-based test. The test uses `fast-check` arbitraries to generate:
- Random valid and invalid registration field combinations (Property 1)
- Random phone numbers in E.164 and non-E.164 formats (Properties 2, 3)
- Random feed page responses with varying item counts (Properties 5)
- Random designer databases with mixed locations (Properties 6, 8, 9)
- Random file descriptors with varying MIME types and sizes (Properties 11)
- Random appointment states and transition attempts (Properties 12, 13)
- Random review score sequences (Property 14)
- Random cart contents paired with payment failure responses (Property 21)
- Random transaction amounts including boundary values (Property 22)
- Random message content strings of varying lengths (Properties 25, 26)
- Random message sequences for ordering verification (Property 27)
- Random notification event payloads (Property 28)
- Random string key sets for translation completeness (Property 29)
- Random locale strings for language defaulting (Property 30)
- Random scroll positions for feed state restoration (Property 32)
- Random Training_Program field combinations covering valid and invalid ranges (Property 33)
- Random Training_Program states at full capacity paired with acceptance attempts (Property 34)
- Random payment gateway outcomes (success, failure, timeout) for training applications (Property 35)
- Random designer planner states with varying training session, appointment, and delivery combinations per day (Property 36)
- Random Collaboration_Project field combinations covering valid and invalid ranges (Property 37)
- Random Collaboration_Project states at full participant capacity paired with invitation attempts (Property 38)

**Tag format** for each property test: `// Feature: cameroon-fashion-app, Property {N}: {property_text}`

### Integration Tests

Integration tests run against a test backend with seeded PostgreSQL and mocked external services:
- Payment provider API (MTN MoMo, Orange Money): mocked with Nock
- FCM/APNs: mocked notification delivery
- AI Outfit Generator: mocked with canned responses
- S3: LocalStack (local AWS simulation)

Integration test scenarios:
- End-to-end order flow: add to cart → checkout → payment confirmation → order created → vendor notified
- Designer notification delivery: appointment request → push notification within 10s (mocked)
- Booking flow: submit booking → notification retry logic (3 retries at 60s intervals)
- Real-time chat: message send → delivery → read receipt lifecycle
- Session refresh: expired access token → transparent refresh → request succeeds
- Training program publication: create program → poll Designer_Profile endpoint, verify visible within 60s
- Training application flow: client applies → payment confirmed (mocked) → application created with status Pending → designer notified within 30s → designer accepts → client notified, enrolledCount incremented
- Timetable update propagation: update timetable → poll profile for update within 60s → verify all accepted applicants notified within 30s (mocked push)
- Planner render: open Designer_Planner with populated training sessions + appointments → verify all event types appear, verify date range covers ≥30 days
- Collaboration publication: create project → poll Designer_Profile, verify portfolio item visible within 60s
- Collaboration invite/accept flow: send invitation → invitee notified within 30s (mocked) → invitee accepts → participant list updated, slots decremented, inviter notified
- Workspace post notification: participant posts note → all other participants notified within 30s (mocked)
- Project deadline auto-complete: set deadline to now (via test clock) → verify project status transitions to Completed and remains on all participant profiles

### Accessibility Testing

Manual testing with:
- iOS VoiceOver: verify all `accessibilityLabel` values are meaningful and distinct from placeholder text
- Android TalkBack: same verification
- Touch target audit: verify all interactive elements render at ≥ 44×44 pt

### Snapshot Tests

- Dashboard layouts per role (light theme snapshot)
- FeedItem component with various image aspect ratios
- Notification banner component in foreground state

### Visual Regression / Layout Tests

- Render all key screens at 320pt and 428pt width; verify no overflow or truncation
- Afrocentric color palette compliance: automated check verifying background and text colors against the defined palette tokens
