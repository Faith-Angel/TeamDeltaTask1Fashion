# Design Document: Cameroon Fashion App

## Overview

The Cameroon Fashion App is a Next.js 15 Progressive Web App (PWA) connecting four distinct roles — Clients, Designers, Vendors, and Marketers — within Cameroon's fashion ecosystem. It enables fashion discovery, designer collaboration, marketplace commerce, marketer bookings, and real-time messaging. The platform integrates local payment solutions (MTN Mobile Money and Orange Money), an AI-powered outfit generator, and a culturally resonant Afrocentric UI (Savanna Bloom palette).

Key design goals:
- Next.js 15 App Router with TypeScript, deployable as a PWA installable on any device
- Role-based route groups with middleware-enforced authentication and a guest browsing mode
- JWT stored in httpOnly cookies — inaccessible to JavaScript, XSS-safe
- Real-time messaging via Socket.IO client connecting to the NestJS WebSocket gateway
- TLS-enforced payment pipeline through MTN MoMo and Orange Money APIs
- Bilingual EN/FR interface via next-intl
- Savanna Bloom visual identity with TailwindCSS + shadcn/ui components
- PWA service worker (next-pwa) for offline caching, push notifications, and "Add to Home Screen"

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router (Client)               │
│                                                                  │
│  Route Groups: (auth) | (guest) | (client) | (designer)          │
│                        (vendor) | (marketer)                     │
│                                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Pages/Layouts │  │   shadcn/ui +    │  │  next-intl      │  │
│  │  App Router    │  │   TailwindCSS    │  │  (EN/FR)        │  │
│  └────────────────┘  └──────────────────┘  └─────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              State Management (Zustand 4)                   │  │
│  │  authStore  feedStore  chatStore  cartStore  uiStore        │  │
│  │  trainingStore  plannerStore  collaborationStore            │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Data Fetching (TanStack Query v5)              │  │
│  │  useQuery  useMutation  useInfiniteQuery                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Service Layer                                  │  │
│  │  apiClient (Axios)  socketClient  pushService               │  │
│  │  mediaUploadService                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         │ HTTPS/REST + httpOnly cookie JWT    │ WSS/Socket.IO
         ▼                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Auth    │ │  Feed /  │ │ Payment  │ │  Chat/Socket     │   │
│  │  Module  │ │Marketplace│ │ Gateway  │ │  Gateway         │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ Designer │ │ Marketer │ │Notification│                        │
│  │ Module   │ │  Module  │ │  Service  │                        │
│  └──────────┘ └──────────┘ └──────────┘                         │
└──────────────────────────────────────────────────────────────────┘
         │                      │                │
   ┌─────┴──────┐      ┌───────┴──┐      ┌──────┴─────┐
   │ PostgreSQL │      │  Redis   │      │   AWS S3   │
   │ (primary)  │      │ (cache/  │      │  (media    │
   │            │      │  queues) │      │  storage)  │
   └────────────┘      └──────────┘      └────────────┘
         │                                      │
   ┌─────┴─────────────────────────────────────┐
   │           External Services               │
   │  MTN MoMo API  |  Orange Money API        │
   │  AI Outfit Service  |  Web Push API       │
   └───────────────────────────────────────────┘
```

### PWA Layer

```
Service Worker (next-pwa)
├── Static asset pre-cache (JS bundles, CSS, fonts)
├── API response cache (stale-while-revalidate for /feed, /marketplace)
├── Push notification listener (Web Push API)
├── Offline fallback → /offline page
└── Background sync for queued chat messages
```

### Architectural Decisions

**Next.js 15 App Router**: Route groups provide clean role-based layouts without custom navigation state. Server Components reduce client JS bundle size; Client Components are used only where interactivity is required. Middleware handles auth gating at the edge before any page renders.

**JWT in httpOnly Cookies**: Tokens are managed server-side and never accessible to JavaScript, eliminating the XSS attack surface present with localStorage. The Next.js middleware reads the cookie on every request to protected route groups and redirects unauthenticated users.

**TanStack Query v5 for Server State**: `useInfiniteQuery` handles cursor-based pagination for feeds and marketplace. `useMutation` handles form submissions with optimistic updates. This replaces the manual Axios lifecycle previously managed inside Zustand stores, making server state and cache invalidation explicit.

**Zustand 4 for Client State**: Owns local UI state (cart, chat messages, socket status, scroll position, language). Non-sensitive state persisted to `localStorage`; JWT is managed via httpOnly cookies (server-side only).

**PostgreSQL + Redis**: PostgreSQL handles relational data. Redis provides session caching, real-time presence, and BullMQ job queues for notification retries and payment callbacks.

**AWS S3 for Media**: Pre-signed URLs allow direct browser-to-S3 uploads without routing large files through the backend.

---

## Technology Stack

| Concern | Library / Service |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | TailwindCSS + shadcn/ui |
| State Management | Zustand 4 |
| Data Fetching | TanStack Query v5 (useQuery, useMutation, useInfiniteQuery) |
| Animations | Framer Motion |
| PWA | next-pwa (service worker + web app manifest) |
| Push Notifications | Web Push API via service worker |
| Real-time | Socket.IO client |
| Auth | JWT in httpOnly cookies + Next.js middleware route protection |
| Forms | react-hook-form + zod |
| Images | next/image |
| Icons | lucide-react |
| Calendar | react-day-picker (bundled with shadcn/ui) |
| File Upload | HTML file input + drag-and-drop + pre-signed S3 URLs |
| i18n | next-intl (EN/FR) |
| Testing | Jest + React Testing Library + fast-check |
| Backend | NestJS (Node.js + TypeScript) |
| Database | PostgreSQL 15 (via TypeORM) |
| Cache / Queues | Redis 7 (via BullMQ for job queues) |
| Media Storage | AWS S3 + CloudFront CDN |
| AI Outfit Generation | OpenAI GPT-4o / DALL-E 3 (via backend proxy) |
| Payment | MTN MoMo API (Collections product) + Orange Money API |
| Push Delivery | Web Push API (VAPID keys, service worker) |

---

## Components and Interfaces

### App Directory Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (guest)/
│   ├── feed/page.tsx
│   └── marketplace/page.tsx
├── (client)/
│   ├── layout.tsx              # Client shell: sidebar nav + top bar
│   ├── dashboard/page.tsx
│   ├── feed/page.tsx
│   ├── designers/page.tsx
│   ├── designers/[id]/page.tsx
│   ├── marketplace/page.tsx
│   ├── marketplace/[id]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── training/page.tsx
│   ├── training/[id]/page.tsx
│   └── chat/page.tsx
├── (designer)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── appointments/page.tsx
│   ├── portfolio/page.tsx
│   ├── marketers/page.tsx
│   ├── training/page.tsx
│   ├── planner/page.tsx
│   └── collaborations/page.tsx
├── (vendor)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── catalog/page.tsx
│   └── orders/page.tsx
├── (marketer)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── portfolio/page.tsx
│   └── bookings/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   └── push/subscribe/route.ts
├── manifest.ts                 # PWA manifest (Savanna Bloom theme)
└── layout.tsx                  # Root layout: PWA meta, fonts, providers
```

### Source Directory Structure

```
src/
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Input, Card, Badge,
│   │                           #   Dialog, Sheet, Tabs, RadioGroup)
│   ├── layout/                 # Sidebar, TopBar, MobileNav, PageShell
│   ├── feed/                   # FeedGrid, FeedItem, ImageDetailSheet,
│   │                           #   EndOfFeedIndicator
│   ├── designer/               # DesignerCard, RankingStars, AvailabilityBadge,
│   │                           #   DesignerProfileHeader
│   ├── chat/                   # MessageBubble, ReadReceipt, MessageInput,
│   │                           #   ConnectionBanner
│   ├── payment/                # PaymentMethodSelector, PaymentStatus
│   ├── planner/                # PlannerCalendar, DayDetailPanel, ConflictIndicator
│   ├── collaboration/          # WorkspaceTabs, NoteCard, FileCard, UpdateCard
│   └── training/               # TrainingCard, TrainingBadge, ApplicationStatusBadge
├── stores/
│   ├── authStore.ts
│   ├── feedStore.ts
│   ├── cartStore.ts
│   ├── chatStore.ts
│   ├── notificationStore.ts
│   ├── uiStore.ts
│   ├── trainingStore.ts
│   ├── plannerStore.ts
│   └── collaborationStore.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useFeed.ts              # useInfiniteQuery wrapper for /feed
│   ├── useDesigners.ts
│   ├── useMarketplace.ts       # useInfiniteQuery for /marketplace
│   ├── useCart.ts
│   ├── useChat.ts
│   ├── useNotifications.ts
│   ├── useTraining.ts
│   ├── usePlanner.ts
│   └── useCollaboration.ts
├── services/
│   ├── apiClient.ts            # Axios instance, cookie-based JWT, 401 refresh interceptor
│   ├── socketClient.ts         # Socket.IO singleton
│   ├── pushService.ts          # Web Push subscription + service worker registration
│   └── mediaUploadService.ts   # Pre-signed S3 URL upload
├── lib/
│   ├── utils.ts                # cn() helper, formatXAF(), formatDate()
│   └── constants.ts
├── types/
│   └── models.ts               # All TypeScript interfaces (User, Designer, Listing, etc.)
├── validation/
│   └── schemas.ts              # All Zod schemas
├── i18n/
│   ├── en.json
│   ├── fr.json
│   └── config.ts
└── theme/
    └── colors.ts               # Savanna Bloom palette tokens
```

### Savanna Bloom Palette

```typescript
export const colors = {
  primary: '#558B2F',
  primaryLight: '#7CB342',
  primaryDark: '#33691E',
  accent: '#F9A825',
  accentLight: '#FDD835',
  background: '#FAFAF5',
  surface: '#FFFFFF',
  textPrimary: '#1B1B1B',
  textSecondary: '#5D4037',
  border: '#E8F5E9',
  error: '#C62828',
  success: '#2E7D32',
  warning: '#F57F17',
  muted: '#F1F8E9',
}
```

### Key Store Interfaces

#### AuthStore (Zustand)
```typescript
interface AuthStore {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setGuest: (val: boolean) => void;
  logout: () => Promise<void>;
}
```

#### CartStore (Zustand)
```typescript
interface CartStore {
  items: CartItem[];
  addItem: (listing: Listing) => void;
  removeItem: (listingId: string) => void;
  clear: () => void;
  total: number;       // derived
  itemCount: number;   // derived — count of distinct items
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

#### FeedStore (Zustand — local UI state only; items owned by TanStack Query)
```typescript
interface FeedStore {
  lastScrollPosition: number;
  setScrollPosition: (pos: number) => void;
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
  pushToken?: string;                 // Web Push endpoint (VAPID)
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
