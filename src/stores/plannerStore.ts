import { create } from 'zustand';
import type { PlannerEvent } from '@/types/models';

interface PlannerStore {
  events: PlannerEvent[];
  selectedDate: Date | null;
  setEvents: (events: PlannerEvent[]) => void;
  addEvent: (event: PlannerEvent) => void;
  removeEvent: (eventId: string) => void;
  updateEvent: (eventId: string, data: Partial<PlannerEvent>) => void;
  setSelectedDate: (date: Date | null) => void;
  getEventsForDate: (date: Date) => PlannerEvent[];
  hasConflict: (date: Date) => boolean;
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  events: [],
  selectedDate: null,

  setEvents: (events) => set({ events }),

  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  removeEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    })),

  updateEvent: (eventId, data) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, ...data } : e
      ),
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),

  getEventsForDate: (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return get().events.filter((e) => e.date.startsWith(dateStr));
  },

  hasConflict: (date) => {
    const events = get().getEventsForDate(date);
    return events.length > 1;
  },
}));
