'use client';

import { useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';
import type { NotificationType } from '@/types/models';

const TYPE_ICONS: Record<NotificationType, string> = {
  appointment_request: '📅',
  appointment_status_update: '📅',
  order_placed: '📦',
  order_status_update: '📦',
  booking_request: '🤝',
  booking_response: '🤝',
  new_message: '💬',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, loadNotifications, markRead, markAllRead } =
    useNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-textSecondary text-sm mt-0.5" aria-live="polite">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={markAllRead}
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-20 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <Bell className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You&apos;ll be notified about orders, messages, and more</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <ol className="space-y-2" aria-label="Notification list">
          {notifications.map((notif) => (
            <li key={notif.id}>
              <button
                onClick={() => { if (!notif.readAt) markRead(notif.id); }}
                className={cn(
                  'w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-colors min-h-[44px]',
                  notif.readAt
                    ? 'bg-surface border-border'
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                )}
                aria-label={`${notif.title}: ${notif.body}${notif.readAt ? '' : ' (unread)'}`}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
                  {TYPE_ICONS[notif.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-textPrimary">{notif.title}</p>
                    {!notif.readAt && (
                      <Badge className="bg-primary text-white border-0 text-xs flex-shrink-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-textSecondary mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-textSecondary mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
