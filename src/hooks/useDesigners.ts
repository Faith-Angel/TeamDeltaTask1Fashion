'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designersApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import type { Designer, PaginatedResponse } from '@/types/models';

interface DesignersFilter {
  location?: string;
  sort?: string;
  q?: string;
}

export function useDesigners(filters?: DesignersFilter) {
  return useInfiniteQuery<PaginatedResponse<Designer>>({
    queryKey: [QUERY_KEYS.DESIGNERS, filters],
    queryFn: ({ pageParam }) =>
      designersApi.getDesigners({ ...filters, cursor: pageParam as string | undefined }).then((r) => r.data),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
  });
}

export function useDesigner(id: string) {
  return useQuery<Designer>({
    queryKey: [QUERY_KEYS.DESIGNER, id],
    queryFn: () => designersApi.getDesigner(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useToggleAvailability(designerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => designersApi.toggleAvailability(designerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGNER, designerId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGNERS] });
    },
  });
}

export function useSubmitReview(designerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (score: number) => designersApi.submitReview(designerId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGNER, designerId] });
    },
  });
}

export function useUploadPortfolioImage(designerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => designersApi.uploadPortfolioImage(designerId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGNER, designerId] });
    },
  });
}

export function useDeletePortfolioImage(designerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => designersApi.deletePortfolioImage(designerId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGNER, designerId] });
    },
  });
}
