import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, USE_MOCKS } from '@/lib/constants';

// ─── Mock data generators ───────────────────────────────────────────────────
import { mockFeedItems, mockDesigners, mockListings, mockConversations, mockMessages, mockNotifications, mockDesigner, mockTrainingPrograms, mockPlannerEvents, mockCollaborationProjects, mockAppointments, mockMarketersList } from './mockData';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: AxiosError | null, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token if available (for cases where it's not in cookie)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 by refreshing token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API methods ─────────────────────────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: unknown) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: { user: { id: '1', ...data as object }, accessToken: 'mock-token' } });
    }
    return apiClient.post('/auth/register', data);
  },
  login: (data: unknown) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: { user: { id: '1', fullName: 'Mock User', role: 'Client' }, accessToken: 'mock-token' } });
    }
    return apiClient.post('/auth/login', data);
  },
  logout: () => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.post('/auth/logout');
  },
  refresh: () => {
    if (USE_MOCKS) return Promise.resolve({ data: { accessToken: 'mock-token' } });
    return apiClient.post('/auth/refresh');
  },
};

// Feed
export const feedApi = {
  getFeed: (cursor?: string, limit = 10) => {
    if (USE_MOCKS) {
      const items = mockFeedItems(cursor ? 10 : 12);
      return Promise.resolve({ data: { items, nextCursor: 'next-cursor', hasMore: true } });
    }
    return apiClient.get('/feed', { params: { cursor, limit } });
  },
  getFeedItem: (id: string) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: mockFeedItems(1)[0] });
    }
    return apiClient.get(`/feed/${id}`);
  },
  getDesignersForFeedItem: (id: string, location: string) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: { designers: mockDesigners(3) } });
    }
    return apiClient.get(`/feed/${id}/designers`, { params: { location } });
  },
  generateOutfit: (prompt: string) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: { concept: `A stunning Kente-inspired outfit: ${prompt}`, imageUrl: 'https://picsum.photos/400/500', prompt } });
    }
    return apiClient.post('/outfit/generate', { prompt });
  },
};

// Designers
export const designersApi = {
  getDesigners: (params?: { location?: string; region?: string; sort?: string; q?: string; specialty?: string; minRating?: string; availability?: string; cursor?: string }) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: { items: mockDesigners(10), nextCursor: 'next', hasMore: false } });
    }
    return apiClient.get('/designers', { params });
  },
  getDesigner: (id: string) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: mockDesigner(id) });
    }
    return apiClient.get(`/designers/${id}`);
  },
  toggleAvailability: (id: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/designers/${id}/availability`);
  },
  uploadPortfolioImage: (id: string, file: File) => {
    if (USE_MOCKS) return Promise.resolve({ data: { url: 'https://picsum.photos/300/400' } });
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/designers/${id}/portfolio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePortfolioImage: (id: string, imageId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.delete(`/designers/${id}/portfolio/${imageId}`);
  },
  submitReview: (id: string, score: number) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.post(`/designers/${id}/reviews`, { score });
  },
};

// Marketplace
export const marketplaceApi = {
  getListings: (params?: { category?: string; location?: string; region?: string; priceRange?: string; sort?: string; cursor?: string }) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: { items: mockListings(10), nextCursor: 'next', hasMore: false } });
    }
    return apiClient.get('/marketplace', { params });
  },
  getListing: (id: string) => {
    if (USE_MOCKS) {
      return Promise.resolve({ data: mockListings(1)[0] });
    }
    return apiClient.get(`/marketplace/${id}`);
  },
};

// Cart / Orders
export const ordersApi = {
  createOrder: (data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'order-1', paymentStatus: 'Pending' } });
    return apiClient.post('/orders', data);
  },
  getOrder: (id: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id, deliveryStatus: 'Pending' } });
    return apiClient.get(`/orders/${id}`);
  },
  getOrders: () => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get('/orders');
  },
  updateDeliveryStatus: (id: string, status: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/orders/${id}/delivery`, { status });
  },
};

// Payments
export const paymentsApi = {
  initiatePayment: (data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { transactionReference: 'TXN-001', status: 'Paid' } });
    return apiClient.post('/payments/initiate', data);
  },
  getTransaction: (ref: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { transactionReference: ref, status: 'Paid' } });
    return apiClient.get(`/payments/${ref}`);
  },
};

// Chat
export const chatApi = {
  getConversations: () => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockConversations() } });
    return apiClient.get('/conversations');
  },
  createConversation: (designerId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'conv-1', designerId } });
    return apiClient.post('/conversations', { designerId });
  },
  getMessages: (conversationId: string, cursor?: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockMessages(conversationId), nextCursor: undefined, hasMore: false } });
    return apiClient.get(`/conversations/${conversationId}/messages`, { params: { cursor } });
  },
};

// Notifications
export const notificationsApi = {
  getNotifications: (cursor?: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockNotifications(), nextCursor: undefined, hasMore: false } });
    return apiClient.get('/notifications', { params: { cursor } });
  },
  markRead: (id: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/notifications/${id}/read`);
  },
  registerDevice: (token: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.post('/devices/token', { token });
  },
};

// Appointments
export const appointmentsApi = {
  getAppointments: (designerId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockAppointments(designerId) } });
    return apiClient.get(`/designers/${designerId}/appointments`);
  },
  updateAppointmentStatus: (id: string, status: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/appointments/${id}/status`, { status });
  },
};

// Marketers
export const marketersApi = {
  getMarketers: (params?: { subRole?: string; region?: string; location?: string; styleSort?: string; cursor?: string }) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockMarketersList(10), nextCursor: undefined, hasMore: false } });
    return apiClient.get('/marketers', { params });
  },
  getMarketer: (id: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: mockMarketersList(1)[0] });
    return apiClient.get(`/marketers/${id}`);
  },
  createBooking: (marketerId: string, data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'booking-1' } });
    return apiClient.post(`/marketers/${marketerId}/bookings`, data);
  },
  respondToBooking: (bookingId: string, status: 'Confirmed' | 'Declined') => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/bookings/${bookingId}/respond`, { status });
  },
  getBookings: () => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get('/bookings/my');
  },
};

// Vendor
export const vendorApi = {
  createListing: (data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'listing-1', ...data as object } });
    return apiClient.post('/vendor/listings', data);
  },
  updateListing: (id: string, data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/vendor/listings/${id}`, data);
  },
  getVendorListings: () => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockListings(5) } });
    return apiClient.get('/vendor/listings');
  },
  getVendorOrders: () => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get('/vendor/orders');
  },
};

// Training
export const trainingApi = {
  getPrograms: (cursor?: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockTrainingPrograms(8), nextCursor: undefined, hasMore: false } });
    return apiClient.get('/training', { params: { cursor } });
  },
  getProgram: (id: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: mockTrainingPrograms(1)[0] });
    return apiClient.get(`/training/${id}`);
  },
  createProgram: (data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'prog-1', ...data as object } });
    return apiClient.post('/training', data);
  },
  updateProgram: (id: string, data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/training/${id}`, data);
  },
  applyToProgram: (programId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'app-1', status: 'Pending' } });
    return apiClient.post(`/training/${programId}/apply`);
  },
  getApplications: (programId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get(`/training/${programId}/applications`);
  },
  respondToApplication: (applicationId: string, status: 'Accepted' | 'Rejected') => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/training/applications/${applicationId}`, { status });
  },
};

// Planner
export const plannerApi = {
  getEvents: (designerId: string, month?: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockPlannerEvents(designerId) } });
    return apiClient.get(`/designers/${designerId}/planner`, { params: { month } });
  },
  createEvent: (designerId: string, data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'event-1', ...data as object } });
    return apiClient.post(`/designers/${designerId}/planner`, data);
  },
  updateEvent: (eventId: string, data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/planner/${eventId}`, data);
  },
  deleteEvent: (eventId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.delete(`/planner/${eventId}`);
  },
};

// Collaborations
export const collaborationsApi = {
  getProjects: (cursor?: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: mockCollaborationProjects(4), nextCursor: undefined, hasMore: false } });
    return apiClient.get('/collaborations', { params: { cursor } });
  },
  getProject: (id: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: mockCollaborationProjects(1)[0] });
    return apiClient.get(`/collaborations/${id}`);
  },
  createProject: (data: unknown) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'proj-1', ...data as object } });
    return apiClient.post('/collaborations', data);
  },
  sendInvitation: (projectId: string, inviteeId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.post(`/collaborations/${projectId}/invite`, { inviteeId });
  },
  respondToInvitation: (invitationId: string, status: 'Accepted' | 'Declined') => {
    if (USE_MOCKS) return Promise.resolve({ data: {} });
    return apiClient.patch(`/collaborations/invitations/${invitationId}`, { status });
  },
  getWorkspaceNotes: (projectId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get(`/collaborations/${projectId}/notes`);
  },
  addNote: (projectId: string, content: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'note-1', content } });
    return apiClient.post(`/collaborations/${projectId}/notes`, { content });
  },
  getWorkspaceFiles: (projectId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get(`/collaborations/${projectId}/files`);
  },
  getWorkspaceUpdates: (projectId: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { items: [] } });
    return apiClient.get(`/collaborations/${projectId}/updates`);
  },
  postUpdate: (projectId: string, content: string) => {
    if (USE_MOCKS) return Promise.resolve({ data: { id: 'update-1', content } });
    return apiClient.post(`/collaborations/${projectId}/updates`, { content });
  },
};

export default apiClient;
