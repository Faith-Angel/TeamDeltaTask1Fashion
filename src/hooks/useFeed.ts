'use client';

import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import { feedApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import type { FeedItem, PaginatedResponse } from '@/types/models';

export function useFeed() {
  return useInfiniteQuery<PaginatedResponse<FeedItem>>({
    queryKey: [QUERY_KEYS.FEED],
    queryFn: ({ pageParam }) => feedApi.getFeed(pageParam as string | undefined).then((r) => r.data),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
  });
}

export function useFeedItem(id: string) {
  return useQuery<FeedItem>({
    queryKey: [QUERY_KEYS.FEED, id],
    queryFn: () => feedApi.getFeedItem(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useOutfitGenerator() {
  return useMutation<{ concept: string; imageUrl: string; prompt: string }, Error, string>({
    mutationFn: (prompt: string) => feedApi.generateOutfit(prompt).then((r) => r.data),
  });
}

export function useDesignersForFeedItem(feedItemId: string, location: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.FEED, feedItemId, 'designers', location],
    queryFn: () => feedApi.getDesignersForFeedItem(feedItemId, location).then((r) => r.data),
    enabled: !!feedItemId && !!location,
  });
}
