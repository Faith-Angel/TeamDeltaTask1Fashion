import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/constants';

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
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error)
);

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
  register: (data: unknown) => apiClient.post('/auth/register', data),
  login: (data: unknown) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: () => apiClient.post('/auth/refresh'),
};

// Feed — backend routes not confirmed, left calling /feed as-is
export const feedApi = {
  getFeed: (cursor?: string, limit = 10) =>
    apiClient.get('/feed', { params: { cursor, limit } }),
  getFeedItem: (id: string) => apiClient.get(`/feed/${id}`),
  getDesignersForFeedItem: (id: string, location: string) =>
    apiClient.get(`/feed/${id}/designers`, { params: { location } }),
  generateOutfit: (prompt: string) => apiClient.post('/outfit/generate', { prompt }),
};

// Designers
export const designersApi = {
  getDesigners: async (params?: { location?: string; region?: string; sort?: string; q?: string; specialty?: string; minRating?: string; availability?: string; cursor?: string }) => {
    const response = await apiClient.get('/designers', { params });
    return {
      ...response,
      data: {
        items: response.data.designers ?? [],
        nextCursor: undefined,
        hasMore: false,
      },
    };
  },
  getDesigner: async (id: string) => {
    const response = await apiClient.get(`/designers/${id}`);
    return { ...response, data: response.data.designer };
  },
  toggleAvailability: (id: string) => apiClient.patch(`/designers/${id}/availability`),
  uploadPortfolioImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/designers/${id}/portfolio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePortfolioImage: (id: string, imageId: string) =>
    apiClient.delete(`/designers/${id}/portfolio/${imageId}`),
  submitReview: (id: string, score: number) =>
    apiClient.post(`/designers/${id}/reviews`, { score }),
};

// Marketplace
export const marketplaceApi = {
  getListings: async (params?: { category?: string; location?: string; region?: string; priceRange?: string; sort?: string; cursor?: string }) => {
    const response = await apiClient.get('/marketplace', { params });
    return {
      ...response,
      data: {
        items: response.data.listings ?? [],
        nextCursor: undefined,
        hasMore: false,
      },
    };
  },
  getListing: async (id: string) => {
    const response = await apiClient.get(`/marketplace/${id}`);
    return { ...response, data: response.data.listing };
  },
};

// Cart / Orders
export const ordersApi = {
  createOrder: async (data: unknown) => {
    const response = await apiClient.post('/orders', data);
    return { ...response, data: response.data.order };
  },
  getOrder: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return { ...response, data: response.data.order };
  },
  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return { ...response, data: { items: response.data.orders ?? [] } };
  },
  updateDeliveryStatus: (id: string, deliveryStatus: string) =>
    apiClient.patch(`/orders/${id}/delivery`, { deliveryStatus }),
};

// Payments
export const paymentsApi = {
  initiatePayment: (data: unknown) => apiClient.post('/payments', data),
  getTransaction: (ref: string) => apiClient.get(`/payments/${ref}`),
};

// Chat — backend routes not confirmed, left as-is
export const chatApi = {
  getConversations: () => apiClient.get('/conversations'),
  createConversation: (designerId: string) => apiClient.post('/conversations', { designerId }),
  getMessages: (conversationId: string, cursor?: string) =>
    apiClient.get(`/conversations/${conversationId}/messages`, { params: { cursor } }),
};

// Notifications
export const notificationsApi = {
  getNotifications: async (cursor?: string) => {
    const response = await apiClient.get('/notifications', { params: { cursor } });
    return {
      ...response,
      data: {
        items: response.data.notifications ?? [],
        unreadCount: response.data.unreadCount ?? 0,
        nextCursor: undefined,
        hasMore: false,
      },
    };
  },
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  registerDevice: (token: string) => apiClient.post('/devices/token', { token }),
};

// Appointments
export const appointmentsApi = {
  getAppointments: async (designerId: string) => {
    const response = await apiClient.get(`/designers/${designerId}/appointments`);
    return { ...response, data: { items: response.data.appointments ?? [] } };
  },
  updateAppointmentStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/appointments/${id}`, { status });
    return { ...response, data: response.data.appointment };
  },
};

// Marketers
export const marketersApi = {
  getMarketers: async (params?: { subRole?: string; region?: string; location?: string; styleSort?: string; cursor?: string }) => {
    const response = await apiClient.get('/marketers', { params });
    return {
      ...response,
      data: {
        items: response.data.marketers ?? [],
        nextCursor: undefined,
        hasMore: false,
      },
    };
  },
  getMarketer: (id: string) => apiClient.get(`/marketers/${id}`),
  createBooking: async (marketerId: string, data: unknown) => {
    const response = await apiClient.post(`/marketers/${marketerId}/bookings`, data);
    return { ...response, data: response.data.booking };
  },
  respondToBooking: (bookingId: string, decision: 'accept' | 'decline') =>
    apiClient.patch(`/bookings/${bookingId}/respond`, { decision }),
  getBookings: () => apiClient.get('/bookings/my'),
};

// Vendor
export const vendorApi = {
  createListing: async (data: unknown) => {
    const response = await apiClient.post('/vendor/listings', data);
    return { ...response, data: response.data.listing };
  },
  updateListing: (id: string, data: unknown) => apiClient.patch(`/vendor/listings/${id}`, data),
  getVendorListings: async () => {
    const response = await apiClient.get('/vendor/listings');
    return { ...response, data: { items: response.data.listings ?? [] } };
  },
  getVendorOrders: async () => {
    const response = await apiClient.get('/vendor/orders');
    return { ...response, data: { items: response.data.orders ?? [] } };
  },
};

// ML Service (visual search + style chat)
export const mlApi = {
  styleChat: (data: { message: string; conversation_id?: string; history?: unknown[]; extract_brief?: boolean }) =>
    apiClient.post('/ml/style-chat', data),
  similarSearch: (data: { image_url: string; top_k?: number; filter?: Record<string, unknown> }) =>
    apiClient.post('/ml/similar-search', data),
};

// Training — backend routes not confirmed, left as-is
export const trainingApi = {
  getPrograms: (cursor?: string) => apiClient.get('/training', { params: { cursor } }),
  getProgram: (id: string) => apiClient.get(`/training/${id}`),
  createProgram: (data: unknown) => apiClient.post('/training', data),
  updateProgram: (id: string, data: unknown) => apiClient.patch(`/training/${id}`, data),
  applyToProgram: (programId: string) => apiClient.post(`/training/${programId}/apply`),
  getApplications: (programId: string) => apiClient.get(`/training/${programId}/applications`),
  respondToApplication: (applicationId: string, status: 'Accepted' | 'Rejected') =>
    apiClient.patch(`/training/applications/${applicationId}`, { status }),
};

// Planner — backend routes not confirmed, left as-is
export const plannerApi = {
  getEvents: (designerId: string, month?: string) =>
    apiClient.get(`/designers/${designerId}/planner`, { params: { month } }),
  createEvent: (designerId: string, data: unknown) =>
    apiClient.post(`/designers/${designerId}/planner`, data),
  updateEvent: (eventId: string, data: unknown) => apiClient.patch(`/planner/${eventId}`, data),
  deleteEvent: (eventId: string) => apiClient.delete(`/planner/${eventId}`),
};

// Collaborations — backend routes not confirmed, left as-is
export const collaborationsApi = {
  getProjects: (cursor?: string) => apiClient.get('/collaborations', { params: { cursor } }),
  getProject: (id: string) => apiClient.get(`/collaborations/${id}`),
  createProject: (data: unknown) => apiClient.post('/collaborations', data),
  sendInvitation: (projectId: string, inviteeId: string) =>
    apiClient.post(`/collaborations/${projectId}/invite`, { inviteeId }),
  respondToInvitation: (invitationId: string, status: 'Accepted' | 'Declined') =>
    apiClient.patch(`/collaborations/invitations/${invitationId}`, { status }),
  getWorkspaceNotes: (projectId: string) => apiClient.get(`/collaborations/${projectId}/notes`),
  addNote: (projectId: string, content: string) =>
    apiClient.post(`/collaborations/${projectId}/notes`, { content }),
  getWorkspaceFiles: (projectId: string) => apiClient.get(`/collaborations/${projectId}/files`),
  getWorkspaceUpdates: (projectId: string) => apiClient.get(`/collaborations/${projectId}/updates`),
  postUpdate: (projectId: string, content: string) =>
    apiClient.post(`/collaborations/${projectId}/updates`, { content }),
};

export default apiClient;