'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import type { Listing, PaginatedResponse } from '@/types/models';

interface MarketplaceFilter {
  category?: string;
  location?: string;
}

export function useMarketplace(filters?: MarketplaceFilter) {
  return useInfiniteQuery<PaginatedResponse<Listing>>({
    queryKey: [QUERY_KEYS.MARKETPLACE, filters],
    queryFn: ({ pageParam }) =>
      marketplaceApi.getListings({ ...filters, cursor: pageParam as string | undefined }).then((r) => r.data),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
  });
}

export function useListing(id: string) {
  return useQuery<Listing>({
    queryKey: [QUERY_KEYS.LISTING, id],
    queryFn: () => marketplaceApi.getListing(id).then((r) => r.data),
    enabled: !!id,
  });
}
