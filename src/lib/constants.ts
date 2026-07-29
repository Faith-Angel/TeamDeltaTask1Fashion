export const APP_NAME = 'NdoloStitch';
export const APP_DESCRIPTION = 'Connect with Cameroonian fashion designers, vendors, and marketers';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ndolostitch.com';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
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

// ── Cameroon Regions & Cities ──────────────────────────────────────────────
export const CAMEROON_REGIONS = [
  {
    value: 'centre',
    label: 'Centre',
    cities: [
      'Yaoundé', 'Obala', 'Bafia', 'Mbalmayo', 'Nanga-Eboko', 'Monatélé',
      'Saa', 'Ntui', 'Mfou', 'Akonolinga', 'Eseka', 'Ngoumou',
      'Mbandjock', 'Ayos', 'Okola',
    ],
  },
  {
    value: 'littoral',
    label: 'Littoral',
    cities: [
      'Douala', 'Edéa', 'Loum', 'Nkongsamba', 'Mbanga', 'Yabassi',
      'Manjo', 'Kumba', 'Melong', 'Penja', 'Njombe', 'Dizangué',
      'Ndom', 'Mouanko', 'Pouma',
    ],
  },
  {
    value: 'west',
    label: 'West',
    cities: [
      'Bafoussam', 'Dschang', 'Foumban', 'Mbouda', 'Bangangté', 'Foumbot',
      'Baham', 'Bafang', 'Bandjoun', 'Koutaba', 'Bazou', 'Massangam',
      'Kekem', 'Tonga', 'Galim',
    ],
  },
  {
    value: 'north-west',
    label: 'North West',
    cities: [
      'Bamenda', 'Kumbo', 'Wum', 'Nkambe', 'Fundong', 'Mbengwi',
      'Batibo', 'Ndu', 'Ako', 'Bali', 'Santa', 'Ndop',
      'Bafut', 'Tubah', 'Misaje',
    ],
  },
  {
    value: 'south-west',
    label: 'South West',
    cities: [
      'Buea', 'Limbe', 'Kumba', 'Mundemba', 'Mamfe', 'Tiko',
      'Muyuka', 'Ekondo Titi', 'Bangem', 'Nguti', 'Tombel', 'Konye',
      'Idenau', 'Meanja', 'Wabane',
    ],
  },
  {
    value: 'north',
    label: 'North',
    cities: [
      'Garoua', 'Guider', 'Pitoa', 'Figuil', 'Lagdo', 'Ngong',
      'Rey Bouba', 'Touboro', 'Poli', 'Bibemi', 'Demsa', 'Tchollire',
      'Madingring', 'Sorombéo', 'Bé',
    ],
  },
  {
    value: 'far-north',
    label: 'Far North',
    cities: [
      'Maroua', 'Kousseri', 'Mokolo', 'Mora', 'Yagoua', 'Kaélé',
      'Waza', 'Mindif', 'Meri', 'Bogo', 'Hina', 'Zina',
      'Tokombéré', 'Petté', 'Kolofata',
    ],
  },
  {
    value: 'adamawa',
    label: 'Adamawa',
    cities: [
      'Ngaoundéré', 'Meiganga', 'Tibati', 'Banyo', 'Tignère', 'Nganha',
      'Dir', 'Kontcha', 'Djohong', 'Belel', 'Ngaoundal', 'Mayo-Baleo',
      'Martap', 'Mbé', 'Yoko',
    ],
  },
  {
    value: 'east',
    label: 'East',
    cities: [
      'Bertoua', 'Abong-Mbang', 'Batouri', 'Yokadouma', 'Belabo', 'Doumé',
      'Lomié', 'Ndélélé', 'Mbang', 'Kette', 'Mindourou', 'Ngoyla',
      'Dimako', 'Messamena', 'Bélabo',
    ],
  },
  {
    value: 'south',
    label: 'South',
    cities: [
      'Ebolowa', 'Kribi', 'Sangmélima', 'Ambam', 'Lolodorf', 'Mvangué',
      'Djoum', 'Mintom', 'Ngoulemakong', 'Akom II', 'Bipindi', 'Campo',
      'Ma\'an', 'Bengbis', 'Zoétélé',
    ],
  },
] as const;

// Flat list for backward compatibility (register page, legacy dropdowns)
export const CAMEROON_LOCATIONS = CAMEROON_REGIONS.flatMap((r) => r.cities);

// ── Designer filter constants ───────────────────────────────────────────────
export const DESIGNER_SPECIALTIES = [
  { value: 'traditional', label: 'Traditional (Kaba, Toghu, Assiko)' },
  { value: 'non-traditional', label: 'Non-Traditional / Contemporary' },
  { value: 'bridal', label: 'Bridal & Wedding' },
  { value: 'corporate', label: 'Corporate / Formal' },
  { value: 'streetwear', label: 'Streetwear & Casual' },
  { value: 'cultural', label: 'Cultural & Ceremonial' },
] as const;

export const RATING_OPTIONS = [
  { value: '4', label: '4★ & above' },
  { value: '3', label: '3★ & above' },
  { value: '2', label: '2★ & above' },
] as const;

export const MARKETPLACE_PRICE_RANGES = [
  { value: '', label: 'Any price' },
  { value: '0-5000', label: 'Under 5,000 XAF' },
  { value: '5000-20000', label: '5,000 – 20,000 XAF' },
  { value: '20000-50000', label: '20,000 – 50,000 XAF' },
  { value: '50000-100000', label: '50,000 – 100,000 XAF' },
  { value: '100000-999999', label: 'Above 100,000 XAF' },
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
