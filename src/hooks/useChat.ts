'use client';

import { useChatStore } from '@/stores/chatStore';

export function useChat() {
  const store = useChatStore();
  return store;
}
