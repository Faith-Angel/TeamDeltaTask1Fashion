'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import { usePlannerStore } from '@/stores/plannerStore';
import type { PlannerEvent } from '@/types/models';

export function usePlannerEvents(designerId: string) {
  const { setEvents } = usePlannerStore();
  return useQuery<{ items: PlannerEvent[] }>({
    queryKey: [QUERY_KEYS.PLANNER_EVENTS, designerId],
    queryFn: async () => {
      const res = await plannerApi.getEvents(designerId);
      setEvents(res.data.items || []);
      return res.data;
    },
    enabled: !!designerId,
  });
}

export function useCreatePlannerEvent(designerId: string) {
  const queryClient = useQueryClient();
  const { addEvent } = usePlannerStore();
  return useMutation({
    mutationFn: (data: unknown) => plannerApi.createEvent(designerId, data).then((r) => r.data),
    onSuccess: (event: PlannerEvent) => {
      addEvent(event);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANNER_EVENTS, designerId] });
    },
  });
}

export function useDeletePlannerEvent(designerId: string) {
  const queryClient = useQueryClient();
  const { removeEvent } = usePlannerStore();
  return useMutation({
    mutationFn: (eventId: string) => plannerApi.deleteEvent(eventId).then((r) => r.data),
    onSuccess: (_, eventId) => {
      removeEvent(eventId);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANNER_EVENTS, designerId] });
    },
  });
}
