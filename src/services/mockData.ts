// Mock data generators for NEXT_PUBLIC_USE_MOCKS=true mode
import type { FeedItem, Designer, Listing, Conversation, Message, Notification, TrainingProgram, PlannerEvent, CollaborationProject, Appointment, Marketer } from '@/types/models';

let counter = 1;
const nextId = () => `mock-${counter++}`;

// ── Curated Cameroonian & African fashion photos from Unsplash ──
// Traditional: Kaba ngondo, Toghu, Bamoun royal, Bamileke, Ndop cloth
// Casual/contemporary: Ankara streetwear, wax print casual, modern fusion

const FEED_PHOTOS = [
  // Traditional fits
  'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&h=500&fit=crop', // woman in traditional African gown
  'https://images.unsplash.com/photo-1594938298603-c8148c4b4dff?w=400&h=500&fit=crop', // colourful African print dress
  'https://images.unsplash.com/photo-1617553428765-94614cbc40d1?w=400&h=500&fit=crop', // elegant African traditional wear
  'https://images.unsplash.com/photo-1607346705510-2b7b1b2a3c89?w=400&h=500&fit=crop', // Kente style gown
  'https://images.unsplash.com/photo-1559582798-678dfc71ccd8?w=400&h=500&fit=crop', // woman in Ankara print
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop', // African fashion model
  // Casual contemporary fits
  'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=400&h=500&fit=crop', // casual streetwear
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', // fashion model casual
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop', // colourful casual outfit
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop', // modern African casual
  'https://images.unsplash.com/photo-1485518994671-12f9c9a40a48?w=400&h=500&fit=crop', // contemporary fashion
  'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=400&h=500&fit=crop', // street style African
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop', // vibrant outfit
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop', // fashion shoot
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=500&fit=crop', // editorial fashion
  'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=500&fit=crop', // full length fashion
];

const FEED_TAGS = [
  ['Traditional', 'Kaba', 'Toghu'],
  ['Ankara', 'Wax Print', 'Contemporary'],
  ['Bamileke', 'Royal', 'Ceremony'],
  ['Modern', 'Fusion', 'Street Style'],
  ['Kente', 'Afrocentric', 'Gown'],
  ['Casual', 'Everyday', 'Wax Print'],
  ['Bridal', 'Traditional', 'Ndop'],
  ['Corporate', 'Modern', 'Ankara'],
];

export function mockFeedItems(count: number): FeedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `feed-${i + 1}`,
    imageUrl: FEED_PHOTOS[i % FEED_PHOTOS.length],
    styleTags: FEED_TAGS[i % FEED_TAGS.length],
    title: [
      'Kaba Ngondo Elegance', 'Ankara Street Style', 'Toghu Royal Look',
      'Modern Wax Fusion', 'Bamileke Ceremony Wear', 'Contemporary Casual',
      'Traditional Bridal', 'Corporate Afro Chic', 'Ndop Cloth Masterpiece',
      'Douala Street Fashion', 'Yaoundé Evening Look', 'Bamenda Heritage Wear',
    ][i % 12],
    description: 'Beautiful Cameroonian fashion design featuring traditional patterns with modern cuts.',
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

const NAMES = [
  'Amara Ngozi', 'Fatima Bello', 'Chidi Okafor', 'Aisha Kamara',
  'Emmanuel Tansi', 'Grace Mbianda', 'Patrick Fotso', 'Marie-Claire Ewane',
  'Samuel Nkengasong', 'Patience Biya'
];
const LOCATIONS = ['Yaoundé', 'Douala', 'Bamenda', 'Bafoussam', 'Garoua'];

const DESIGNER_PORTFOLIO_PHOTOS = [
  // Traditional/ceremonial works
  'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1594938298603-c8148c4b4dff?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1617553428765-94614cbc40d1?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559582798-678dfc71ccd8?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop',
  // Casual/contemporary works
  'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&h=400&fit=crop',
];

export function mockDesigners(count: number): Designer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `designer-${i + 1}`,
    userId: `user-d-${i + 1}`,
    fullName: NAMES[i % NAMES.length],
    portfolioImages: Array.from({ length: 3 }, (__, j) => ({
      id: `img-${i}-${j}`,
      url: DESIGNER_PORTFOLIO_PHOTOS[(i * 3 + j) % DESIGNER_PORTFOLIO_PHOTOS.length],
      mimeType: 'image/jpeg' as const,
      sizeBytes: 1024 * 500,
      uploadedAt: new Date().toISOString(),
    })),
    rankingScore: +(3.5 + Math.random() * 1.5).toFixed(1),
    reviewCount: Math.floor(Math.random() * 50) + 5,
    availability: (['Available', 'Busy', 'Unavailable'] as const)[i % 3],
    completedFitsCount: Math.floor(Math.random() * 100) + 10,
    pendingAppointmentsCount: Math.floor(Math.random() * 5),
    location: LOCATIONS[i % LOCATIONS.length],
  }));
}

export function mockDesigner(id: string): Designer {
  return {
    id,
    userId: `user-${id}`,
    fullName: NAMES[0],
    portfolioImages: Array.from({ length: 8 }, (_, j) => ({
      id: `img-${j}`,
      url: DESIGNER_PORTFOLIO_PHOTOS[j % DESIGNER_PORTFOLIO_PHOTOS.length],
      mimeType: 'image/jpeg' as const,
      sizeBytes: 1024 * 800,
      uploadedAt: new Date().toISOString(),
    })),
    rankingScore: 4.5,
    reviewCount: 32,
    availability: 'Available',
    completedFitsCount: 47,
    pendingAppointmentsCount: 3,
    location: 'Yaoundé',
  };
}

// ── Product photos for marketplace listings ──
const PRODUCT_PHOTOS = [
  // Clothing
  'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=300&h=300&fit=crop', // traditional gown
  'https://images.unsplash.com/photo-1594938298603-c8148c4b4dff?w=300&h=300&fit=crop', // Ankara dress
  'https://images.unsplash.com/photo-1617553428765-94614cbc40d1?w=300&h=300&fit=crop', // kaftan
  'https://images.unsplash.com/photo-1559582798-678dfc71ccd8?w=300&h=300&fit=crop',   // wax print blouse
  'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=300&h=300&fit=crop', // casual top
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop', // jumpsuit
  // Accessories
  'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=300&h=300&fit=crop', // beaded jewellery
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=300&fit=crop', // necklace
  'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=300&h=300&fit=crop', // bracelet set
  // Shoes
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop', // leather sandals
  'https://images.unsplash.com/photo-1544441893-675973e31985?w=300&h=300&fit=crop', // platform shoes
  // Hair
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop', // hair extensions
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop', // braids product
];

// ── Fixed price list that spans all XAF ranges ──
// Deliberately includes items under 5,000 XAF so the price filter works
const LISTING_PRICES = [
  1500, 2000, 2500, 3000, 3500, 4000, 4500,   // under 5,000
  5500, 7000, 9000, 12000, 15000, 18000,       // 5,000–20,000
  22000, 28000, 35000, 42000, 48000,           // 20,000–50,000
  55000, 65000, 75000, 90000, 95000,           // 50,000–100,000
  105000, 115000, 120000,                       // above 100,000
];

const LISTING_DATA: Array<{ name: string; category: 'clothes' | 'accessories' | 'shoes' | 'hairstyle_products_services'; description: string }> = [
  { name: 'Kaba Ngondo Ceremonial Gown', category: 'clothes', description: 'Handwoven traditional gown from Wouri estuary. Features intricate Bassa patterns in rich indigo and gold.' },
  { name: 'Toghu Embroidered Jacket', category: 'clothes', description: 'Authentic Toghu velvet jacket with hand-stitched gold embroidery. Worn at royal and ceremonial occasions in the North West.' },
  { name: 'Ankara Wrap Dress', category: 'clothes', description: 'Vibrant Dutch wax print wrap dress. Modern silhouette with traditional Cameroonian motifs.' },
  { name: 'Bamileke Ndop Cloth Set', category: 'clothes', description: 'Sacred Ndop hand-dyed indigo cloth from the Bamileke kingdom. Two-piece set for ceremonial wear.' },
  { name: 'Bamoun Embroidered Boubou', category: 'clothes', description: 'Royal Bamoun-style grande boubou with geometric embroidery. Made from premium damask fabric in Foumban.' },
  { name: 'Wax Print Midi Skirt', category: 'clothes', description: 'Vibrant Ankara wax print midi skirt. Mix-and-match contemporary piece for everyday elegance.' },
  { name: 'Casual Ankara Blazer', category: 'clothes', description: 'Tailored Ankara blazer — perfect for corporate Afro chic. Available in multiple prints.' },
  { name: 'Traditional Loincloth Wrapper', category: 'clothes', description: 'Hand-dyed strip-woven loincloth from Bafia. Natural dyes, 100% cotton.' },
  { name: 'Fulani Embroidered Kaftan', category: 'clothes', description: 'Northern Cameroonian grand Fulani kaftan with elaborate machine embroidery on the neck and sleeves.' },
  { name: 'Beaded Ceremonial Necklace', category: 'accessories', description: 'Hand-strung Grassfield ceremonial necklace with coloured glass beads and cowrie shells.' },
  { name: 'Bamileke Chief Bangles Set', category: 'accessories', description: 'Bronze bangles inspired by Bamileke royal regalia. Set of 3, handcast in Bafoussam.' },
  { name: 'Woven Raffia Basket Bag', category: 'accessories', description: 'Handwoven raffia basket bag from Foumban artisans. Perfect day bag with leather handles.' },
  { name: 'Leather Tikar Sandals', category: 'shoes', description: 'Hand-stitched leather sandals in Tikar style from Ngoumou. Durable sole, all-day comfort.' },
  { name: 'Beaded Grassfield Slippers', category: 'shoes', description: 'Colourful beaded slippers from the Western Grassfields. Handmade, every pair is unique.' },
  { name: 'Platform Ankara Sneakers', category: 'shoes', description: 'Contemporary platform sneakers with Ankara fabric uppers. Street fashion meets Cameroonian heritage.' },
  { name: 'Braiding Hair Extensions Pack', category: 'hairstyle_products_services', description: 'High-quality synthetic braiding hair, kink-free. 6 packs per set. Ideal for box braids and cornrows.' },
  { name: 'Shea Butter Hair Cream', category: 'hairstyle_products_services', description: 'Unrefined shea butter from Ngaoundéré mixed with coconut oil. Deep conditioning for natural hair.' },
  { name: 'Natural Twist-Out Kit', category: 'hairstyle_products_services', description: 'Complete twist-out kit: defining cream, edge control, and satin bonnet. Made with Cameroonian shea.' },
];

export function mockListings(count: number): Listing[] {
  return Array.from({ length: count }, (_, i) => {
    const item = LISTING_DATA[i % LISTING_DATA.length];
    return {
      id: `listing-${i + 1}`,
      vendorId: `vendor-${(i % 3) + 1}`,
      vendorName: NAMES[(i + 5) % NAMES.length],
      vendorLocation: LOCATIONS[i % LOCATIONS.length],
      name: item.name,
      category: item.category,
      description: item.description,
      price: LISTING_PRICES[i % LISTING_PRICES.length],
      images: [{ id: `img-l${i}`, url: PRODUCT_PHOTOS[i % PRODUCT_PHOTOS.length], sizeBytes: 512000 }],
      inStock: i % 5 !== 0,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

export function mockConversations(): Conversation[] {
  return NAMES.slice(0, 5).map((name, i) => ({
    id: `conv-${i + 1}`,
    clientId: 'current-user',
    designerId: `designer-${i + 1}`,
    designerName: name,
    lastMessage: {
      id: `msg-last-${i}`,
      conversationId: `conv-${i + 1}`,
      senderId: `designer-${i + 1}`,
      type: 'text' as const,
      content: 'Looking forward to working with you!',
      deliveryStatus: 'Read' as const,
      retryCount: 0,
      sentAt: new Date(Date.now() - i * 3600000).toISOString(),
    },
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

export function mockMessages(conversationId: string): Message[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `msg-${conversationId}-${i}`,
    conversationId,
    senderId: i % 2 === 0 ? 'current-user' : 'designer-1',
    type: 'text' as const,
    content: i % 2 === 0
      ? `Hi! I love your work. ${i === 0 ? 'Can you help me with an outfit?' : 'What are your rates?'}`
      : `Thank you! ${i === 1 ? 'I would be happy to help!' : 'My rates start at 15,000 XAF.'}`,
    deliveryStatus: 'Read' as const,
    retryCount: 0,
    sentAt: new Date(Date.now() - (10 - i) * 300000).toISOString(),
    readAt: new Date().toISOString(),
  }));
}

export function mockNotifications(): Notification[] {
  const types = ['appointment_request', 'order_placed', 'new_message', 'booking_request'] as const;
  return Array.from({ length: 6 }, (_, i) => ({
    id: `notif-${i + 1}`,
    recipientId: 'current-user',
    recipientRole: 'Client',
    type: types[i % types.length],
    title: ['New Appointment Request', 'Order Confirmed', 'New Message', 'Booking Request'][i % 4],
    body: ['Client Amara wants to book you for a fitting.', 'Your order #12345 has been confirmed.', 'Grace Mbianda sent you a message.', 'Designer Emmanuel wants to book you.'][i % 4],
    data: { id: `${i + 1}` },
    channel: 'both' as const,
    readAt: i < 3 ? new Date().toISOString() : undefined,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

export function mockTrainingPrograms(count: number): TrainingProgram[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `prog-${i + 1}`,
    designerId: `designer-${(i % 3) + 1}`,
    designerName: NAMES[i % NAMES.length],
    title: `Fashion Design Masterclass ${i + 1}`,
    description: 'Learn the fundamentals of African fashion design, from pattern making to final fitting. This comprehensive program covers traditional Cameroonian techniques alongside modern design principles.',
    durationCategory: (i % 2 === 0 ? 'short-term' : 'long-term') as 'short-term' | 'long-term',
    startDate: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString(),
    maxCapacity: 20 + (i * 5),
    enrolledCount: Math.floor(Math.random() * 15),
    price: 50000 + i * 25000,
    timetable: 'Monday & Wednesday 10:00-13:00, Friday 14:00-17:00',
    status: (['Published', 'Draft', 'Published'] as const)[i % 3],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function mockPlannerEvents(designerId: string): PlannerEvent[] {
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => ({
    id: `event-${i + 1}`,
    designerId,
    title: ['Client Fitting - Amara', 'Training Session', 'Fabric Delivery', 'Photography Shoot', 'Design Review'][i % 5],
    date: new Date(now.getFullYear(), now.getMonth(), (i + 1) * 3).toISOString(),
    note: i % 2 === 0 ? 'Prepare the Kente swatches' : undefined,
    type: (['appointment', 'training', 'delivery', 'custom'] as const)[i % 4],
    createdAt: new Date().toISOString(),
  }));
}

export function mockCollaborationProjects(count: number): CollaborationProject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `collab-${i + 1}`,
    creatorId: `designer-${i + 1}`,
    creatorName: NAMES[i % NAMES.length],
    title: `Joint Fashion Collection ${i + 1}`,
    description: 'Collaboration on a luxury Afrocentric fashion collection combining traditional Cameroonian fabrics with contemporary silhouettes.',
    requiredSkills: 'Pattern making, Embroidery, Photography',
    deadline: new Date(Date.now() + (i + 2) * 30 * 86400000).toISOString(),
    collaboratorSlots: 3 + i,
    participants: [`designer-${i + 2}`, `designer-${i + 3}`].slice(0, i + 1),
    status: (i % 3 === 0 ? 'Completed' : 'Active') as 'Active' | 'Completed',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function mockAppointments(designerId: string): Appointment[] {
  const statuses = ['Pending', 'Attended', 'Unattended', 'Delivered'] as const;
  return Array.from({ length: 8 }, (_, i) => ({
    id: `appt-${i + 1}`,
    clientId: `client-${i + 1}`,
    clientName: NAMES[i % NAMES.length],
    designerId,
    status: statuses[i % statuses.length],
    requestedAt: new Date(Date.now() - (8 - i) * 86400000).toISOString(),
    attendedAt: ['Attended', 'Delivered'].includes(statuses[i % statuses.length])
      ? new Date(Date.now() - (7 - i) * 86400000).toISOString()
      : undefined,
    deliveredAt: statuses[i % statuses.length] === 'Delivered'
      ? new Date(Date.now() - (6 - i) * 86400000).toISOString()
      : undefined,
    notes: i % 3 === 0 ? 'Client wants traditional Kente fabric' : undefined,
  }));
}

export function mockMarketersList(count: number): Marketer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `marketer-${i + 1}`,
    userId: `user-m-${i + 1}`,
    fullName: NAMES[i % NAMES.length],
    subRole: (i % 2 === 0 ? 'Model' : 'Content_Creator') as 'Model' | 'Content_Creator',
    portfolioFiles: Array.from({ length: 3 }, (__, j) => ({
      id: `file-${i}-${j}`,
      url: `https://picsum.photos/seed/m${i}${j}/300/300`,
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeBytes: 1024 * 400,
    })),
    bookingStatus: (i % 4 === 0 ? 'Booked' : 'Available') as 'Available' | 'Booked',
    location: LOCATIONS[i % LOCATIONS.length],
  }));
}

// suppress unused counter warning
void nextId;
