import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '@/lib/constants';

type SocketStatus = 'connected' | 'reconnecting' | 'disconnected';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
let statusCallback: ((status: SocketStatus) => void) | null = null;
let messageCallback: ((message: unknown) => void) | null = null;
let readCallback: ((data: unknown) => void) | null = null;

function getReconnectDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s... capped at 30s
  return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 30000);
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: false, // We handle reconnection manually for exponential backoff
  });

  socket.on(SOCKET_EVENTS.CONNECT, () => {
    reconnectAttempts = 0;
    statusCallback?.('connected');
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    statusCallback?.('disconnected');
    scheduleReconnect(token);
  });

  socket.on(SOCKET_EVENTS.ERROR, () => {
    statusCallback?.('disconnected');
    scheduleReconnect(token);
  });

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, (message: unknown) => {
    messageCallback?.(message);
  });

  socket.on(SOCKET_EVENTS.MESSAGE_READ, (data: unknown) => {
    readCallback?.(data);
  });

  return socket;
}

function scheduleReconnect(token: string) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    statusCallback?.('disconnected');
    return;
  }

  statusCallback?.('reconnecting');
  const delay = getReconnectDelay(reconnectAttempts);
  reconnectAttempts++;

  setTimeout(() => {
    if (!socket?.connected) {
      connectSocket(token);
    }
  }, delay);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  reconnectAttempts = 0;
}

export function getSocket(): Socket | null {
  return socket;
}

export function onStatusChange(callback: (status: SocketStatus) => void) {
  statusCallback = callback;
}

export function onNewMessage(callback: (message: unknown) => void) {
  messageCallback = callback;
}

export function onMessageRead(callback: (data: unknown) => void) {
  readCallback = callback;
}

export function sendMessage(conversationId: string, content: string, type: 'text' | 'image' = 'text') {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit(SOCKET_EVENTS.MESSAGE_SEND, { conversationId, content, type });
}

export function markMessageRead(messageId: string) {
  if (!socket?.connected) return;
  socket.emit(SOCKET_EVENTS.MESSAGE_READ, { messageId });
}
