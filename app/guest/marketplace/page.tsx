'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/apiClient';
import { ShoppingBag, MapPin } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { LISTING_CATEGORIES, CAMEROON_REGIONS } from '@/lib/constants';

export default function GuestMarketplacePage() {
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['guest-marketplace', category, region],
    queryFn: () =>
      marketplaceApi
        .getListings({ category: category || undefined, region: region || undefined })
        .then((r) => r.data),
  });

  const items = (data?.items ?? []) as Array<{
    id: string;
    name: string;
    price: number;
    images: { url: string }[];
    inStock: boolean;
    vendorLocation?: string;
    category: string;
  }>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" aria-hidden="true" />
          Cameroonian Fashion Market
        </h1>
        <p className="text-textSecondary text-sm mt-1">
          Browse authentic fashion —{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            sign up
          </Link>{' '}
          to purchase
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Browse sections">
        <Link
          href="/guest/feed"
          role="tab"
          aria-selected="false"
          className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors min-h-[44px] flex items-center"
        >
          Inspiration Feed
        </Link>
        <Link
          href="/guest/marketplace"
          role="tab"
          aria-selected="true"
          className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-white min-h-[44px] flex items-center"
        >
          Marketplace
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {LISTING_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Filter by region"
        >
          <option value="">All Regions</option>
          {CAMEROON_REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-square animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((listing) => (
            <div
              key={listing.id}
              className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              aria-label={listing.name}
            >
              <div className="relative aspect-square bg-muted">
                {listing.images[0]?.url ? (
                  <Image
                    src={listing.images[0].url}
                    alt={listing.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-textSecondary text-xs">
                    No image
                  </div>
                )}
                {!listing.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-error text-white text-xs px-2 py-1 rounded-full font-medium">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="font-semibold text-textPrimary text-sm line-clamp-2">{listing.name}</p>
                {listing.vendorLocation && (
                  <div className="flex items-center gap-1 text-xs text-textSecondary mt-0.5">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {listing.vendorLocation}
                  </div>
                )}
                <p className="text-primary font-bold mt-1">{formatXAF(listing.price)}</p>
                <div className="mt-auto pt-2">
                  <Link
                    href="/register"
                    className="w-full block text-center bg-primary/10 text-primary text-xs font-medium py-2 rounded-lg hover:bg-primary/20 transition-colors"
                    aria-label={`Sign up to buy ${listing.name}`}
                  >
                    Sign up to buy
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No listings found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center py-8 border-t border-border">
        <p className="text-textSecondary mb-4 font-medium">Want to buy or sell Cameroonian fashion?</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors inline-flex items-center min-h-[44px]"
          >
            Join as Buyer
          </Link>
          <Link
            href="/register"
            className="border border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/10 transition-colors inline-flex items-center min-h-[44px]"
          >
            Sell Your Fashion
          </Link>
        </div>
      </div>
    </div>
  );
}
