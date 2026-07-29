import { create } from 'zustand';
import type { Conversation, Message } from '@/types/models';
import { connectSocket, disconnectSocket, onStatusChange, onNewMessage, sendMessage as socketSend, markMessageRead } from '@/services/socketClient';
import { chatApi } from '@/services/apiClient';

type SocketStatus = 'connected' | 'reconnecting' | 'disconnected';

interface MessageContent {
  type: 'text' | 'image';
  content: string;
}

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeMessages: Message[];
  socketStatus: SocketStatus;
  isLoadingMessages: boolean;

  initSocket: (token: string) => void;
  disconnectChat: () => void;
  loadConversations: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: MessageContent) => Promise<void>;
  markRead: (messageId: string) => void;
  receiveMessage: (message: Message) => void;
  closeConversation: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  activeMessages: [],
  socketStatus: 'disconnected',
  isLoadingMessages: false,

  initSocket: (token) => {
    connectSocket(token);
    onStatusChange((status) => set({ socketStatus: status }));
    onNewMessage((message) => get().receiveMessage(message as Message));
  },

  disconnectChat: () => {
    disconnectSocket();
    set({ socketStatus: 'disconnected' });
  },

  loadConversations: async () => {
    try {
      const res = await chatApi.getConversations();
      set({ conversations: res.data.items || [] });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },

  openConversation: async (conversationId) => {
    set({ activeConversationId: conversationId, isLoadingMessages: true });
    try {
      const res = await chatApi.getMessages(conversationId);
      set({ activeMessages: res.data.items || [], isLoadingMessages: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, content) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: 'current-user',
      type: content.type,
      content: content.content,
      deliveryStatus: 'Sending',
      retryCount: 0,
      sentAt: new Date().toISOString(),
    };

    // Optimistic update
    set((state) => ({
      activeMessages: [...state.activeMessages, tempMessage],
    }));

    let retries = 0;
    const maxRetries = 3;

    const attemptSend = async (): Promise<void> => {
      try {
        socketSend(conversationId, content.content, content.type);
        // Update optimistic message to Delivered
        set((state) => ({
          activeMessages: state.activeMessages.map((m) =>
            m.id === tempMessage.id
              ? { ...m, deliveryStatus: 'Delivered' as const }
              : m
          ),
        }));
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          setTimeout(() => attemptSend(), 5000);
        } else {
          set((state) => ({
            activeMessages: state.activeMessages.map((m) =>
              m.id === tempMessage.id
                ? { ...m, deliveryStatus: 'Failed' as const, retryCount: retries }
                : m
            ),
          }));
        }
        throw error;
      }
    };

    await attemptSend();
  },

  markRead: (messageId) => {
    markMessageRead(messageId);
    set((state) => ({
      activeMessages: state.activeMessages.map((m) =>
        m.id === messageId
          ? { ...m, deliveryStatus: 'Read' as const, readAt: new Date().toISOString() }
          : m
      ),
    }));
  },

  receiveMessage: (message) => {
    const { activeConversationId } = get();
    if (message.conversationId === activeConversationId) {
      set((state) => ({
        activeMessages: [...state.activeMessages, message],
      }));
    }
    // Update last message in conversations
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === message.conversationId
          ? { ...c, lastMessage: message }
          : c
      ),
    }));
  },

  closeConversation: () => {
    set({ activeConversationId: null, activeMessages: [] });
  },
}));
