'use client';

import { useNotificationStore } from '@/stores/notificationStore';

export function useNotifications() {
  return useNotificationStore();
}
