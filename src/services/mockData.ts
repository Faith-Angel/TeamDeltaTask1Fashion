// Mock data generators for NEXT_PUBLIC_USE_MOCKS=true mode
import type { FeedItem, Designer, Listing, Conversation, Message, Notification, TrainingProgram, PlannerEvent, CollaborationProject, Appointment, Marketer } from '@/types/models';

let counter = 1;
const nextId = () => `mock-${counter++}`;

export function mockFeedItems(count: number): FeedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `feed-${i + 1}`,
    imageUrl: `https://picsum.photos/seed/feed${i + 1}/400/500`,
    styleTags: ['Kente', 'Afrocentric', 'Modern', 'Traditional'].slice(0, (i % 4) + 1),
    title: `Fashion Inspiration ${i + 1}`,
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

export function mockDesigners(count: number): Designer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `designer-${i + 1}`,
    userId: `user-d-${i + 1}`,
    fullName: NAMES[i % NAMES.length],
    portfolioImages: Array.from({ length: 3 }, (__, j) => ({
      id: `img-${i}-${j}`,
      url: `https://picsum.photos/seed/d${i}${j}/300/400`,
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
      url: `https://picsum.photos/seed/port${j}/300/400`,
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

export function mockListings(count: number): Listing[] {
  const categories = ['clothes', 'accessories', 'shoes', 'hairstyle_products_services'] as const;
  const names = [
    'Kente Wrapper Dress', 'Ankara Print Blouse', 'Beaded Necklace Set',
    'Leather Sandals', 'Hair Extensions Bundle', 'Embroidered Kaftan',
    'Wax Print Jumpsuit', 'Traditional Cap', 'Bangles Collection', 'Platform Heels'
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `listing-${i + 1}`,
    vendorId: `vendor-${(i % 3) + 1}`,
    vendorName: NAMES[(i + 5) % NAMES.length],
    vendorLocation: LOCATIONS[i % LOCATIONS.length],
    name: names[i % names.length],
    category: categories[i % categories.length],
    description: 'Handcrafted with premium African fabrics and materials. Perfect for any occasion.',
    price: (5000 + Math.floor(Math.random() * 95000)),
    images: [{ id: `img-l${i}`, url: `https://picsum.photos/seed/listing${i}/300/300`, sizeBytes: 512000 }],
    inStock: i % 5 !== 0,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
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
