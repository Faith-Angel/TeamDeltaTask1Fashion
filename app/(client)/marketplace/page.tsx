'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, ShoppingCart, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useCart } from '@/hooks/useCart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatXAF, debounce } from '@/lib/utils';
import { CAMEROON_REGIONS, LISTING_CATEGORIES, MARKETPLACE_PRICE_RANGES } from '@/lib/constants';
import type { Listing } from '@/types/models';

function ListingCard({ listing, onAdd }: { listing: Listing; onAdd: (l: Listing) => void }) {
  const image = listing.images[0]?.url;

  return (
    <article
      className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
      aria-label={listing.name}
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          <Image src={image} alt={listing.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 33vw" />
        ) : (
          <div className="h-full flex items-center justify-center text-textSecondary text-xs">No image</div>
        )}
        {!listing.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge className="bg-error text-white border-0">Out of Stock</Badge>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-textPrimary text-sm line-clamp-2">{listing.name}</p>
        <div className="flex items-center gap-1 text-xs text-textSecondary mt-0.5">
          <MapPin className="w-3 h-3" aria-hidden="true" />
          {listing.vendorLocation || 'Cameroon'}
        </div>
        <p className="text-primary font-bold mt-1">{formatXAF(listing.price)}</p>

        <div className="mt-auto pt-3">
          <Button
            size="sm"
            className={cn('w-full text-xs gap-1', listing.inStock ? 'bg-primary text-white' : 'opacity-50 cursor-not-allowed')}
            disabled={!listing.inStock}
            onClick={() => onAdd(listing)}
            aria-label={`Add ${listing.name} to cart`}
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            Add to Cart
          </Button>
        </div>
      </div>
    </article>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 pointer-events-none',
        type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
      )}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" aria-hidden="true" /> : <XCircle className="w-4 h-4" aria-hidden="true" />}
      {message}
    </div>
  );
}

export default function MarketplacePage() {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [region, setRegion] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { addItem } = useCart();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMarketplace({
    category: category || undefined,
    location: location || undefined,
    region: region || undefined,
    priceRange: priceRange || undefined,
    sort: sort || undefined,
  });

  const allListings = data?.pages.flatMap((p) => p.items) ?? [];

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = (listing: Listing) => {
    try {
      addItem(listing);
      showToast(`${listing.name} added to cart`, 'success');
    } catch {
      showToast('Item is unavailable', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Marketplace</h1>
        <p className="text-textSecondary text-sm mt-1">Shop authentic Cameroonian fashion</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3" role="search" aria-label="Filter marketplace">
        {/* Row 1: Category + Region + City */}
        <div className="flex flex-wrap gap-2">
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
            onChange={(e) => { setRegion(e.target.value); setLocation(''); }}
            aria-label="Filter by region"
          >
            <option value="">All Regions</option>
            {CAMEROON_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {region && (
            <select
              className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Filter by city"
            >
              <option value="">All Cities in Region</option>
              {(CAMEROON_REGIONS.find((r) => r.value === region)?.cities ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {/* Row 2: Price range + Sort + Clear */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            aria-label="Filter by price range"
          >
            {MARKETPLACE_PRICE_RANGES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort listings"
          >
            <option value="">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="recent">Newest First</option>
          </select>

          {(category || region || location || priceRange || sort) && (
            <button
              onClick={() => {
                setCategory(''); setRegion(''); setLocation('');
                setPriceRange(''); setSort('');
              }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-error border border-error/30 bg-error/5 rounded-md min-h-[44px] hover:bg-error/10 transition-colors"
              aria-label="Clear all filters"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading listings">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-square animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <>
          {allListings.length === 0 ? (
            <div className="text-center py-16 text-textSecondary">
              <p className="text-lg font-medium">No listings found</p>
              <p className="text-sm mt-1">Try changing the category or location</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allListings.map((l) => (
                <ListingCard key={l.id} listing={l} onAdd={handleAdd} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                aria-label="Load more listings"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
