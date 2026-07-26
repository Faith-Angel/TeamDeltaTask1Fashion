export const APP_NAME = 'NdoloStitch';
export const APP_DESCRIPTION = 'Connect with Cameroonian fashion designers, vendors, and marketers';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ndolostitch.com';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  // Guest
  GUEST_FEED: '/guest/feed',
  GUEST_MARKETPLACE: '/guest/marketplace',
  // Client
  CLIENT_DASHBOARD: '/dashboard',
  CLIENT_FEED: '/feed',
  CLIENT_DESIGNERS: '/designers',
  CLIENT_MARKETPLACE: '/marketplace',
  CLIENT_CART: '/cart',
  CLIENT_CHECKOUT: '/checkout',
  CLIENT_TRAINING: '/training',
  CLIENT_CHAT: '/chat',
  // Designer
  DESIGNER_DASHBOARD: '/designer/dashboard',
  DESIGNER_APPOINTMENTS: '/designer/appointments',
  DESIGNER_PORTFOLIO: '/designer/portfolio',
  DESIGNER_MARKETERS: '/designer/marketers',
  DESIGNER_TRAINING: '/designer/training',
  DESIGNER_PLANNER: '/designer/planner',
  DESIGNER_COLLABORATIONS: '/designer/collaborations',
  // Vendor
  VENDOR_DASHBOARD: '/vendor/dashboard',
  VENDOR_CATALOG: '/vendor/catalog',
  VENDOR_ORDERS: '/vendor/orders',
  // Marketer
  MARKETER_DASHBOARD: '/marketer/dashboard',
  MARKETER_PORTFOLIO: '/marketer/portfolio',
  MARKETER_BOOKINGS: '/marketer/bookings',
} as const;

export const LISTING_CATEGORIES = [
  { value: 'clothes', label: 'Clothes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'hairstyle_products_services', label: 'Hairstyle Products & Services' },
] as const;

export const CAMEROON_LOCATIONS = [
  'Yaoundé',
  'Douala',
  'Garoua',
  'Bamenda',
  'Bafoussam',
  'Ngaoundéré',
  'Bertoua',
  'Loum',
  'Kumba',
  'Edéa',
  'Nkongsamba',
  'Maroua',
  'Buea',
  'Ebolowa',
] as const;

export const MAX_PORTFOLIO_IMAGES = 50;
export const MAX_PORTFOLIO_FILES = 50;
export const MAX_LISTING_IMAGES = 10;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_LISTING_IMAGE_SIZE_MB = 5;
export const MAX_VIDEO_SIZE_MB = 200;
export const MAX_VIDEO_DURATION_SECS = 300;

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const PAYMENT_METHODS = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'orange_money', label: 'Orange Money', icon: '🟠' },
] as const;

export const DELIVERY_STATUSES = ['Pending', 'In Transit', 'Delivered'] as const;
export const APPOINTMENT_STATUSES = ['Pending', 'Attended', 'Unattended', 'Delivered'] as const;
export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Declined', 'Failed'] as const;
export const TRAINING_STATUSES = ['Draft', 'Published', 'Completed'] as const;

export const TRAINING_DURATION_CATEGORIES = [
  { value: 'short-term', label: 'Short-term (3–6 months)' },
  { value: 'long-term', label: 'Long-term (1–2 years)' },
] as const;

export const QUERY_KEYS = {
  FEED: 'feed',
  DESIGNERS: 'designers',
  DESIGNER: 'designer',
  MARKETPLACE: 'marketplace',
  LISTING: 'listing',
  CART: 'cart',
  ORDERS: 'orders',
  ORDER: 'order',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  TRAINING_PROGRAMS: 'training-programs',
  TRAINING_PROGRAM: 'training-program',
  TRAINING_APPLICATIONS: 'training-applications',
  PLANNER_EVENTS: 'planner-events',
  COLLABORATION_PROJECTS: 'collaboration-projects',
  COLLABORATION_PROJECT: 'collaboration-project',
  WORKSPACE_NOTES: 'workspace-notes',
  WORKSPACE_FILES: 'workspace-files',
  WORKSPACE_UPDATES: 'workspace-updates',
  MARKETERS: 'marketers',
  MARKETER: 'marketer',
  APPOINTMENTS: 'appointments',
} as const;

export const SOCKET_EVENTS = {
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELIVERED: 'message:delivered',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
} as const;
