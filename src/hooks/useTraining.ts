'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import type { TrainingProgram, TrainingApplication, PaginatedResponse } from '@/types/models';

export function useTrainingPrograms() {
  return useInfiniteQuery<PaginatedResponse<TrainingProgram>>({
    queryKey: [QUERY_KEYS.TRAINING_PROGRAMS],
    queryFn: ({ pageParam }) => trainingApi.getPrograms(pageParam as string | undefined).then((r) => r.data),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
  });
}

export function useTrainingProgram(id: string) {
  return useQuery<TrainingProgram>({
    queryKey: [QUERY_KEYS.TRAINING_PROGRAM, id],
    queryFn: () => trainingApi.getProgram(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => trainingApi.createProgram(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAINING_PROGRAMS] });
    },
  });
}

export function useApplyToProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => trainingApi.applyToProgram(programId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAINING_APPLICATIONS] });
    },
  });
}

export function useProgramApplications(programId: string) {
  return useQuery<{ items: TrainingApplication[] }>({
    queryKey: [QUERY_KEYS.TRAINING_APPLICATIONS, programId],
    queryFn: () => trainingApi.getApplications(programId).then((r) => r.data),
    enabled: !!programId,
  });
}

export function useRespondToApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: 'Accepted' | 'Rejected' }) =>
      trainingApi.respondToApplication(applicationId, status).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAINING_APPLICATIONS] });
    },
  });
}
