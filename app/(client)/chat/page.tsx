'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, MessageCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, timeAgo, getInitials } from '@/lib/utils';
import type { Conversation, Message } from '@/types/models';

function StatusDot({ status }: { status: 'connected' | 'reconnecting' | 'disconnected' }) {
  const colors = {
    connected: 'bg-success',
    reconnecting: 'bg-warning animate-pulse',
    disconnected: 'bg-error',
  };
  const labels = {
    connected: 'Connected',
    reconnecting: 'Reconnecting…',
    disconnected: 'Disconnected',
  };
  return (
    <span className="flex items-center gap-1.5 text-xs text-textSecondary" aria-live="polite" role="status">
      <span className={cn('w-2 h-2 rounded-full', colors[status])} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const name = conv.designerName || conv.clientName || 'Unknown';
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors min-h-[44px]',
        isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
      )}
      aria-current={isActive ? 'true' : 'false'}
      aria-label={`Conversation with ${name}`}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className="bg-primary/20 text-primary text-sm">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-textPrimary truncate">{name}</p>
        {conv.lastMessage && (
          <p className="text-xs text-textSecondary truncate">{conv.lastMessage.content}</p>
        )}
      </div>
      {conv.lastMessage && (
        <span className="text-xs text-textSecondary flex-shrink-0">
          {timeAgo(conv.lastMessage.sentAt)}
        </span>
      )}
    </button>
  );
}

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <div
      className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
      role="article"
      aria-label={isMine ? 'Your message' : 'Received message'}
    >
      <div
        className={cn(
          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
          isMine
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-muted text-textPrimary rounded-bl-sm'
        )}
      >
        <p>{message.content}</p>
        <p
          className={cn('text-xs mt-1', isMine ? 'text-white/60' : 'text-textSecondary')}
          aria-label={`Sent ${timeAgo(message.sentAt)}`}
        >
          {timeAgo(message.sentAt)}
          {isMine && (
            <span className="ml-1" aria-label={`Status: ${message.deliveryStatus}`}>
              {message.deliveryStatus === 'Read' ? '✓✓' : message.deliveryStatus === 'Delivered' ? '✓' : message.deliveryStatus === 'Failed' ? '✗' : '…'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const {
    conversations,
    activeConversationId,
    activeMessages,
    socketStatus,
    isLoadingMessages,
    loadConversations,
    openConversation,
    sendMessage,
    closeConversation,
  } = useChat();

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const handleSend = async () => {
    if (!text.trim() || !activeConversationId || isSending) return;
    const content = text.trim();
    setText('');
    setIsSending(true);
    try {
      await sendMessage(activeConversationId, { type: 'text', content });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversation list */}
      <aside
        className={cn(
          'w-full md:w-72 flex-shrink-0 flex flex-col bg-surface rounded-xl border border-border',
          activeConversationId ? 'hidden md:flex' : 'flex'
        )}
        aria-label="Conversations"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="font-semibold text-textPrimary">Messages</h1>
          <StatusDot status={socketStatus} />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-border" aria-hidden="true" />
              <p className="text-sm font-medium">No conversations</p>
              <p className="text-xs mt-1">Message a designer to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => openConversation(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Message thread */}
      <main
        className={cn(
          'flex-1 flex flex-col bg-surface rounded-xl border border-border',
          !activeConversationId ? 'hidden md:flex' : 'flex'
        )}
        aria-label="Message thread"
      >
        {!activeConversationId ? (
          <div className="flex-1 flex items-center justify-center text-textSecondary">
            <div className="text-center">
              <MessageCircle className="w-14 h-14 mx-auto mb-3 text-border" aria-hidden="true" />
              <p className="font-medium">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <button
                onClick={closeConversation}
                className="md:hidden text-textSecondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Back to conversations"
              >
                ←
              </button>
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {getInitials(activeConv?.designerName || activeConv?.clientName || '?')}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-textPrimary">
                {activeConv?.designerName || activeConv?.clientName || 'Conversation'}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-label="Messages" aria-live="polite">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8" role="status">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
                </div>
              ) : activeMessages.length === 0 ? (
                <p className="text-center text-textSecondary text-sm py-8">No messages yet. Say hello!</p>
              ) : (
                activeMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === user?.id || msg.senderId === 'current-user'} />
                ))
              )}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  aria-label="Message input"
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!text.trim() || isSending}
                  className="bg-primary text-white min-h-[44px] min-w-[44px]"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
