import { create } from 'zustand';
import type { Notification } from '@/types/models';
import { notificationsApi } from '@/services/apiClient';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.getNotifications();
      const items: Notification[] = res.data.items || [];
      const unreadCount = items.filter((n) => !n.readAt).length;
      set({ notifications: items, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    try {
      await notificationsApi.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllRead: () => {
    const now = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, readAt: now })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.readAt ? 0 : 1),
    }));
  },
}));
