'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketersApi } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import type { Booking } from '@/types/models';

const STATUS_STYLES: Record<Booking['status'], string> = {
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Confirmed: 'bg-success/10 text-success border-success/20',
  Declined: 'bg-error/10 text-error border-error/20',
  Failed: 'bg-muted text-textSecondary border-border',
};

const STATUS_ICONS: Record<Booking['status'], React.ReactNode> = {
  Pending: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
  Confirmed: <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  Declined: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  Failed: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
};

export default function MarketerBookingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Booking['status'] | 'All'>('All');
  const user = useAuthStore((s) => s.user);

  const bookingDescription =
    user?.marketerSubRole === 'Model'
      ? 'Designers book you for photo shoots and fashion modeling'
      : user?.marketerSubRole === 'Content_Creator'
      ? 'Designers book you for content creation, videos, and social media campaigns'
      : 'Designers book you here for shoots and collaborations';

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'marketer'],
    queryFn: () => marketersApi.getBookings().then((r) => r.data),
  });

  const { mutate: respond, isPending: responding } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Confirmed' | 'Declined' }) =>
      marketersApi.respondToBooking(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'marketer'] }),
  });

  const bookings: Booking[] = data?.items ?? [];
  const filtered = bookings.filter((b) => filter === 'All' || b.status === filter);

  const counts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const pendingCount = counts['Pending'] || 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Bookings</h1>
        <p className="text-textSecondary text-sm mt-1">
          {bookingDescription}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['Pending', 'Confirmed', 'Declined', 'Failed'] as Booking['status'][]).map((s) => (
          <div key={s} className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className={cn('text-xl font-bold', s === 'Confirmed' ? 'text-success' : s === 'Pending' ? 'text-warning' : 'text-primary')}>
              {counts[s] || 0}
            </p>
            <p className="text-xs text-textSecondary">{s}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div
          className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-5 flex items-center gap-3"
          role="alert"
          aria-live="polite"
        >
          <Clock className="w-5 h-5 text-accent flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-accent">
            {pendingCount} booking{pendingCount !== 1 ? 's' : ''} waiting for your response
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6" role="tablist" aria-label="Filter bookings by status">
        {(['All', 'Pending', 'Confirmed', 'Declined', 'Failed'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px]',
              filter === f
                ? 'bg-primary text-white'
                : 'bg-muted text-textSecondary hover:bg-primary/10 hover:text-primary'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-36 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No bookings yet</p>
          <p className="text-sm mt-1">Designers will book you once they discover your portfolio</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ol className="space-y-4" aria-label="Bookings list">
          {filtered.map((booking) => (
            <li
              key={booking.id}
              className="bg-surface rounded-xl border border-border p-5"
              aria-label={`Booking from ${booking.designerName}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-textPrimary">{booking.designerName}</p>
                  <p className="text-xs text-textSecondary mt-0.5">
                    Booking #{booking.id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'text-xs border flex-shrink-0 flex items-center gap-1',
                    STATUS_STYLES[booking.status]
                  )}
                >
                  {STATUS_ICONS[booking.status]}
                  {booking.status}
                </Badge>
              </div>

              <p className="text-sm text-textSecondary mb-3 line-clamp-3">{booking.description}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textSecondary mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {formatDate(booking.proposedStartDate)} → {formatDate(booking.proposedEndDate)}
                </span>
              </div>

              {booking.status === 'Pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-success text-white text-xs"
                    disabled={responding}
                    onClick={() => respond({ id: booking.id, status: 'Confirmed' })}
                    aria-label={`Confirm booking from ${booking.designerName}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-error border-error/30 hover:bg-error/10"
                    disabled={responding}
                    onClick={() => respond({ id: booking.id, status: 'Declined' })}
                    aria-label={`Decline booking from ${booking.designerName}`}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Decline
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
