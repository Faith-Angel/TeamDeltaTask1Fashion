'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit2, CheckCircle, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '@/services/apiClient';
import { QUERY_KEYS, LISTING_CATEGORIES } from '@/lib/constants';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema, type ListingInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatXAF } from '@/lib/utils';
import type { Listing } from '@/types/models';

function ListingFormModal({
  existing,
  onClose,
}: {
  existing?: Listing;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!existing;

  const { mutate: create, isPending: creating, isSuccess: created } = useMutation({
    mutationFn: (data: ListingInput) => vendorApi.createListing(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MARKETPLACE, 'vendor'] }),
  });

  const { mutate: update, isPending: updating, isSuccess: updated } = useMutation({
    mutationFn: (data: ListingInput) => vendorApi.updateListing(existing!.id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MARKETPLACE, 'vendor'] }),
  });

  const isPending = creating || updating;
  const isSuccess = created || updated;

  const { register, handleSubmit, formState: { errors } } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          category: existing.category,
          description: existing.description,
          price: existing.price,
          inStock: existing.inStock,
        }
      : { inStock: true },
  });

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-textPrimary">
            {isEdit ? 'Listing updated!' : 'Listing created!'}
          </p>
          <Button className="mt-5 w-full bg-primary text-white" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit listing' : 'Create new listing'}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-textPrimary">
            {isEdit ? 'Edit Listing' : 'New Listing'}
          </h2>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data) => isEdit ? update(data) : create(data))}
          className="p-5 space-y-4"
        >
          {/* Name */}
          <div>
            <label htmlFor="l-name" className="block text-sm font-medium text-textPrimary mb-1">
              Product Name
            </label>
            <Input
              id="l-name"
              placeholder="e.g. Kente Wrapper Dress"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && <p className="text-error text-xs mt-1" role="alert">{errors.name.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="l-category" className="block text-sm font-medium text-textPrimary mb-1">
              Category
            </label>
            <select
              id="l-category"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              aria-invalid={!!errors.category}
              {...register('category')}
            >
              <option value="">Select category</option>
              {LISTING_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-error text-xs mt-1" role="alert">{errors.category.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="l-desc" className="block text-sm font-medium text-textPrimary mb-1">
              Description
            </label>
            <textarea
              id="l-desc"
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Describe your product…"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && <p className="text-error text-xs mt-1" role="alert">{errors.description.message}</p>}
          </div>

          {/* Price + stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="l-price" className="block text-sm font-medium text-textPrimary mb-1">
                Price (XAF)
              </label>
              <Input
                id="l-price"
                type="number"
                min={0}
                placeholder="15000"
                aria-invalid={!!errors.price}
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className="text-error text-xs mt-1" role="alert">{errors.price.message}</p>}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  {...register('inStock')}
                  aria-label="Mark as in stock"
                />
                <span className="text-sm font-medium text-textPrimary">In Stock</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  onEdit,
}: {
  listing: Listing;
  onEdit: (l: Listing) => void;
}) {
  const image = listing.images[0]?.url;

  return (
    <article
      className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col"
      aria-label={listing.name}
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          <Image src={image} alt={listing.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-border" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge
            className={cn(
              'text-xs border-0',
              listing.inStock ? 'bg-success/90 text-white' : 'bg-error/90 text-white'
            )}
          >
            {listing.inStock ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-textPrimary text-sm line-clamp-1">{listing.name}</p>
        <p className="text-xs text-textSecondary capitalize mt-0.5">
          {listing.category.replace(/_/g, ' ')}
        </p>
        <p className="text-primary font-bold text-sm mt-1">{formatXAF(listing.price)}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-auto pt-3 text-xs gap-1"
          onClick={() => onEdit(listing)}
          aria-label={`Edit ${listing.name}`}
        >
          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
          Edit
        </Button>
      </div>
    </article>
  );
}

export default function VendorCatalogPage() {
  const [editTarget, setEditTarget] = useState<Listing | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.MARKETPLACE, 'vendor'],
    queryFn: () => vendorApi.getVendorListings().then((r) => r.data),
  });

  const listings: Listing[] = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Catalog</h1>
          <p className="text-textSecondary text-sm mt-1">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          className="bg-primary text-white gap-2"
          onClick={() => setShowCreate(true)}
          aria-label="Add new listing"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Listing
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-square animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div
          className="border-2 border-dashed border-border rounded-2xl py-20 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => setShowCreate(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowCreate(true)}
          aria-label="Add your first listing"
        >
          <Package className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium text-textPrimary">No listings yet</p>
          <p className="text-sm text-textSecondary mt-1">Add your first product to start selling</p>
        </div>
      )}

      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} onEdit={setEditTarget} />
          ))}
        </div>
      )}

      {showCreate && <ListingFormModal onClose={() => setShowCreate(false)} />}
      {editTarget && <ListingFormModal existing={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}
