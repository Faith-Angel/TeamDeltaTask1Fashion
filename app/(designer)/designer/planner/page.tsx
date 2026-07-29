'use client';

import { useState } from 'react';
import { Plus, Trash2, CalendarDays, Circle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePlannerEvents, useCreatePlannerEvent, useDeletePlannerEvent } from '@/hooks/usePlanner';
import { usePlannerStore } from '@/stores/plannerStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { plannerEventSchema, type PlannerEventInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { PlannerEvent } from '@/types/models';

const TYPE_COLORS: Record<PlannerEvent['type'], string> = {
  appointment: 'bg-primary/10 text-primary',
  training: 'bg-accent/15 text-accent',
  delivery: 'bg-success/10 text-success',
  custom: 'bg-accent/10 text-accent',
};

const TYPE_ICONS: Record<PlannerEvent['type'], string> = {
  appointment: '📅',
  training: '📚',
  delivery: '📦',
  custom: '✏️',
};

function CreateEventModal({ designerId, onClose }: { designerId: string; onClose: () => void }) {
  const { mutate: create, isPending } = useCreatePlannerEvent(designerId);

  const { register, handleSubmit, formState: { errors } } = useForm<PlannerEventInput>({
    resolver: zodResolver(plannerEventSchema),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add planner event"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-textPrimary">Add Event</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">✕</button>
        </div>
        <form
          onSubmit={handleSubmit((data) => create(data, { onSuccess: onClose }))}
          className="p-5 space-y-4"
        >
          <div>
            <label htmlFor="event-title" className="block text-sm font-medium text-textPrimary mb-1">Title</label>
            <Input id="event-title" placeholder="e.g. Client fitting – Amara" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && <p className="text-error text-xs mt-1" role="alert">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-textPrimary mb-1">Date & Time</label>
            <Input id="event-date" type="datetime-local" aria-invalid={!!errors.date} {...register('date')} />
            {errors.date && <p className="text-error text-xs mt-1" role="alert">{errors.date.message}</p>}
          </div>

          <div>
            <label htmlFor="event-note" className="block text-sm font-medium text-textPrimary mb-1">Note (optional)</label>
            <Input id="event-note" placeholder="Any extra details…" {...register('note')} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventCard({ event, onDelete }: { event: PlannerEvent; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li
      className="bg-surface rounded-xl border border-border p-4 flex items-start justify-between gap-3"
      aria-label={event.title}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5" aria-hidden="true">{TYPE_ICONS[event.type]}</span>
        <div>
          <p className="font-medium text-textPrimary text-sm">{event.title}</p>
          <p className="text-xs text-textSecondary mt-0.5">{formatDateTime(event.date)}</p>
          {event.note && (
            <p className="text-xs text-textSecondary mt-1 bg-muted rounded px-2 py-1">{event.note}</p>
          )}
          <Badge className={cn('mt-2 text-xs border-0', TYPE_COLORS[event.type])}>
            {event.type}
          </Badge>
        </div>
      </div>

      <div className="flex-shrink-0">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-textSecondary hover:text-error transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Delete event: ${event.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => setConfirming(false)} className="text-xs text-textSecondary hover:text-primary min-h-[44px] px-2">No</button>
            <button onClick={() => onDelete(event.id)} className="text-xs text-error font-medium min-h-[44px] px-2">Delete</button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function DesignerPlannerPage() {
  const user = useAuthStore((s) => s.user);
  const designerId = user?.id || '';

  usePlannerEvents(designerId);
  const { events } = usePlannerStore();
  const { mutate: deleteEvent } = useDeletePlannerEvent(designerId);
  const [showCreate, setShowCreate] = useState(false);

  // Group events by date
  const grouped = events.reduce<Record<string, PlannerEvent[]>>((acc, event) => {
    const day = event.date.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Planner</h1>
          <p className="text-textSecondary text-sm mt-1">Organise your schedule and avoid conflicts</p>
        </div>
        <Button className="bg-primary text-white gap-2" onClick={() => setShowCreate(true)} aria-label="Add new event">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-textSecondary">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No events scheduled</p>
          <p className="text-sm mt-1">Add appointments, training sessions and deliveries to your planner</p>
          <Button className="mt-4 bg-primary text-white" onClick={() => setShowCreate(true)}>
            Add First Event
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <section key={day} aria-labelledby={`day-${day}`}>
              <h2
                id={`day-${day}`}
                className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-2 flex items-center gap-2"
              >
                <Circle className="w-2 h-2 text-primary fill-primary" aria-hidden="true" />
                {formatDate(day)}
                {grouped[day].length > 1 && (
                  <Badge className="bg-warning/10 text-warning border-0 text-xs">
                    {grouped[day].length} events — check for conflicts
                  </Badge>
                )}
              </h2>
              <ul className="space-y-2">
                {grouped[day].map((ev) => (
                  <EventCard key={ev.id} event={ev} onDelete={(id) => deleteEvent(id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {showCreate && <CreateEventModal designerId={designerId} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
