// NdoloStitch — Shared TypeScript data model interfaces

export type UserRole = 'Client' | 'Designer' | 'Vendor' | 'Marketer';
export type MarketerSubRole = 'Model' | 'Content_Creator';

export interface User {
  id: string;
  fullName: string;
  email: string;
  location: string;
  role: UserRole;
  marketerSubRole?: MarketerSubRole;
  failedLoginAttempts: number;
  lockedUntil?: string;
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioImage {
  id: string;
  url: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  uploadedAt: string;
}

export interface Designer {
  id: string;
  userId: string;
  fullName: string;
  portfolioImages: PortfolioImage[];
  rankingScore: number;
  reviewCount: number;
  availability: 'Available' | 'Busy' | 'Unavailable';
  completedFitsCount: number;
  pendingAppointmentsCount: number;
  location: string;
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  location: string;
}

export interface ListingImage {
  id: string;
  url: string;
  sizeBytes: number;
}

export type ListingCategory = 'clothes' | 'accessories' | 'shoes' | 'hairstyle_products_services';

export interface Listing {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorLocation?: string;
  name: string;
  category: ListingCategory;
  description: string;
  price: number;
  images: ListingImage[];
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketerFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
}

export interface Marketer {
  id: string;
  userId: string;
  fullName: string;
  subRole: MarketerSubRole;
  portfolioFiles: MarketerFile[];
  bookingStatus: 'Available' | 'Booked';
  location: string;
}

export interface OrderItem {
  listingId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  clientId: string;
  vendorId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'mtn_momo' | 'orange_money';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentReference?: string;
  deliveryStatus: 'Pending' | 'In Transit' | 'Delivered';
  deliveryReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  designerId: string;
  status: 'Pending' | 'Attended' | 'Unattended' | 'Delivered';
  requestedAt: string;
  attendedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  designerId: string;
  marketerId: string;
  designerName: string;
  description: string;
  proposedStartDate: string;
  proposedEndDate: string;
  status: 'Pending' | 'Confirmed' | 'Declined' | 'Failed';
  notificationAttempts: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image';
  content: string;
  deliveryStatus: 'Sending' | 'Delivered' | 'Read' | 'Failed';
  retryCount: number;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  designerId: string;
  clientName?: string;
  designerName?: string;
  lastMessage?: Message;
  createdAt: string;
}

export type NotificationType =
  | 'appointment_request'
  | 'appointment_status_update'
  | 'order_placed'
  | 'order_status_update'
  | 'booking_request'
  | 'booking_response'
  | 'new_message';

export interface Notification {
  id: string;
  recipientId: string;
  recipientRole: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  channel: 'push' | 'in_app' | 'both';
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  designerId: string;
  clientId: string;
  score: number;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  imageUrl: string;
  styleTags: string[];
  title?: string;
  description?: string;
  createdAt: string;
}

export interface TrainingProgram {
  id: string;
  designerId: string;
  designerName?: string;
  title: string;
  description: string;
  durationCategory: 'short-term' | 'long-term';
  startDate: string;
  maxCapacity: number;
  enrolledCount: number;
  price: number;
  timetable: string;
  status: 'Draft' | 'Published' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface TrainingApplication {
  id: string;
  programId: string;
  clientId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  paymentReference: string;
  appliedAt: string;
  respondedAt?: string;
}

export interface PlannerEvent {
  id: string;
  designerId: string;
  title: string;
  date: string;
  note?: string;
  type: 'appointment' | 'training' | 'delivery' | 'custom';
  createdAt: string;
}

export interface CollaborationProject {
  id: string;
  creatorId: string;
  creatorName?: string;
  title: string;
  description: string;
  requiredSkills: string;
  deadline: string;
  collaboratorSlots: number;
  participants: string[];
  status: 'Active' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeId: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  sentAt: string;
  respondedAt?: string;
}

export interface WorkspaceNote {
  id: string;
  projectId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface WorkspaceFile {
  id: string;
  projectId: string;
  uploaderId: string;
  url: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  sizeBytes: number;
  uploadedAt: string;
}

export interface WorkspaceUpdate {
  id: string;
  projectId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface CartItem {
  listing: Listing;
  quantity: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OutfitGenerationResult {
  concept: string;
  imageUrl: string;
  prompt: string;
}
