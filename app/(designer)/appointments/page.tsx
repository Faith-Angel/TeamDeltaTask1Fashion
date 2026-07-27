'use client';

import { useState } from 'react';
import { ClipboardList, User, Calendar, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateTime, formatDate } from '@/lib/utils';
import type { Appointment } from '@/types/models';

const STATUS_STYLES: Record<Appointment['status'], string> = {
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Attended: 'bg-success/10 text-success border-success/20',
  Unattended: 'bg-error/10 text-error border-error/20',
  Delivered: 'bg-success/10 text-success border-success/20',
};

const NEXT_STATUS: Record<string, Appointment['status'] | null> = {
  Pending: 'Attended',
  Attended: 'Delivered',
  Delivered: null,
  Unattended: null,
};

const NEXT_LABEL: Record<string, string> = {
  Pending: 'Mark Attended',
  Attended: 'Mark Delivered',
};

export default function DesignerAppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Appointment['status'] | 'All'>('All');

  const { data, isLoading } = useQuery<{ items: Appointment[] }>({
    queryKey: [QUERY_KEYS.APPOINTMENTS, user?.id],
    queryFn: () => appointmentsApi.getAppointments(user?.id || '').then((r) => r.data),
    enabled: !!user?.id,
  });

  const { mutate: updateStatus, isPending: updating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateAppointmentStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPOINTMENTS, user?.id] }),
  });

  const appointments = (data?.items ?? []).filter(
    (a) => filter === 'All' || a.status === filter
  );

  const statusCounts = (data?.items ?? []).reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Appointments</h1>
        <p className="text-textSecondary text-sm mt-1">Track and manage client fitting requests</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['Pending', 'Attended', 'Delivered', 'Unattended'] as Appointment['status'][]).map((s) => (
          <div key={s} className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-xl font-bold text-primary">{statusCounts[s] || 0}</p>
            <p className="text-xs text-textSecondary">{s}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6" role="tablist" aria-label="Filter appointments">
        {(['All', 'Pending', 'Attended', 'Delivered', 'Unattended'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px]',
              filter === f ? 'bg-primary text-white' : 'bg-muted text-textSecondary hover:bg-primary/10 hover:text-primary'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-28 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No appointments</p>
          <p className="text-sm mt-1">Client appointment requests will appear here</p>
        </div>
      )}

      {!isLoading && (
        <ol className="space-y-3" aria-label="Appointments list">
          {appointments.map((appt) => {
            const nextStatus = NEXT_STATUS[appt.status];
            return (
              <li
                key={appt.id}
                className="bg-surface rounded-xl border border-border p-5"
                aria-label={`Appointment with ${appt.clientName}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-textPrimary">{appt.clientName}</p>
                      <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        Requested {formatDate(appt.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn('text-xs border flex-shrink-0', STATUS_STYLES[appt.status])}>
                    {appt.status}
                  </Badge>
                </div>

                {appt.notes && (
                  <p className="text-sm text-textSecondary bg-muted rounded-lg px-3 py-2 mt-3">
                    &ldquo;{appt.notes}&rdquo;
                  </p>
                )}

                {appt.attendedAt && (
                  <p className="text-xs text-textSecondary mt-2">
                    Attended: {formatDateTime(appt.attendedAt)}
                  </p>
                )}
                {appt.deliveredAt && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" aria-hidden="true" />
                    Delivered: {formatDateTime(appt.deliveredAt)}
                  </p>
                )}

                {nextStatus && (
                  <Button
                    size="sm"
                    className="mt-4 bg-primary text-white text-xs"
                    disabled={updating}
                    onClick={() => updateStatus({ id: appt.id, status: nextStatus })}
                    aria-label={`${NEXT_LABEL[appt.status]} for ${appt.clientName}`}
                  >
                    {NEXT_LABEL[appt.status]}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
