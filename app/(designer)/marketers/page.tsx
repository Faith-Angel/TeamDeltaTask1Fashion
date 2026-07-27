'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Camera, Video, CheckCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { marketersApi } from '@/services/apiClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { CAMEROON_REGIONS } from '@/lib/constants';
import { bookingRequestSchema, type BookingRequestInput } from '@/validation/schemas';
import type { Marketer } from '@/types/models';

function BookingModal({ marketer, onClose }: { marketer: Marketer; onClose: () => void }) {
  const [success, setSuccess] = useState(false);
  const { mutate: book, isPending } = useMutation({
    mutationFn: (data: BookingRequestInput) =>
      marketersApi.createBooking(marketer.id, data).then((r) => r.data),
    onSuccess: () => setSuccess(true),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingRequestInput>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: { designerName: '' },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Book ${marketer.fullName}`}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-textPrimary">Book {marketer.fullName}</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">✕</button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-textPrimary">Booking request sent!</p>
            <p className="text-sm text-textSecondary mt-1">
              {marketer.fullName} will be notified and will respond to your request.
            </p>
            <Button className="mt-5 w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => book(data))} className="p-5 space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-textPrimary mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe the collaboration you have in mind…"
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                aria-invalid={!!errors.description}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-error text-xs mt-1" role="alert">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="proposedStartDate" className="block text-sm font-medium text-textPrimary mb-1">
                  Start Date
                </label>
                <Input
                  id="proposedStartDate"
                  type="date"
                  aria-invalid={!!errors.proposedStartDate}
                  {...register('proposedStartDate')}
                />
                {errors.proposedStartDate && (
                  <p className="text-error text-xs mt-1" role="alert">{errors.proposedStartDate.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="proposedEndDate" className="block text-sm font-medium text-textPrimary mb-1">
                  End Date
                </label>
                <Input
                  id="proposedEndDate"
                  type="date"
                  aria-invalid={!!errors.proposedEndDate}
                  {...register('proposedEndDate')}
                />
                {errors.proposedEndDate && (
                  <p className="text-error text-xs mt-1" role="alert">{errors.proposedEndDate.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary text-white" disabled={isPending}>
                {isPending ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MarketerCard({ marketer, onBook }: { marketer: Marketer; onBook: (m: Marketer) => void }) {
  const cover = marketer.portfolioFiles[0]?.url;
  const isAvailable = marketer.bookingStatus === 'Available';

  return (
    <article
      className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
      aria-label={`${marketer.fullName} — ${marketer.subRole.replace('_', ' ')}`}
    >
      <div className="relative h-40 bg-muted">
        {cover ? (
          <Image src={cover} alt={`${marketer.fullName} portfolio`} fill className="object-cover" sizes="350px" />
        ) : (
          <div className="h-full flex items-center justify-center text-textSecondary text-sm">No portfolio</div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={cn('text-xs border-0', isAvailable ? 'bg-success/90 text-white' : 'bg-error/90 text-white')}>
            {isAvailable ? 'Available' : 'Booked'}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <p className="font-semibold text-textPrimary">{marketer.fullName}</p>
        <div className="flex items-center gap-2 mt-1">
          {marketer.subRole === 'Model' ? (
            <Badge className="bg-primary/10 text-primary border-0 text-xs flex items-center gap-1">
              <Camera className="w-3 h-3" aria-hidden="true" /> 📸 Model
            </Badge>
          ) : (
            <Badge className="bg-accent/10 text-accent border-0 text-xs flex items-center gap-1">
              <Video className="w-3 h-3" aria-hidden="true" /> 🎬 Content Creator
            </Badge>
          )}
          <span className="text-border">·</span>
          <span className="flex items-center gap-1 text-xs text-textSecondary">
            <MapPin className="w-3 h-3" aria-hidden="true" /> {marketer.location}
          </span>
        </div>

        <p className="text-xs text-textSecondary mt-1">
          {marketer.portfolioFiles.length} portfolio file{marketer.portfolioFiles.length !== 1 ? 's' : ''}
        </p>

        <Button
          size="sm"
          className={cn('w-full mt-3 text-xs', isAvailable ? 'bg-primary text-white' : 'opacity-50')}
          disabled={!isAvailable}
          onClick={() => onBook(marketer)}
          aria-label={`Book ${marketer.fullName}`}
        >
          {isAvailable ? 'Book Now' : 'Currently Booked'}
        </Button>
      </div>
    </article>
  );
}

export default function DesignerMarketersPage() {
  const [subRole, setSubRole] = useState('');
  const [location, setLocation] = useState('');
  const [region, setRegion] = useState('');
  const [styleSort, setStyleSort] = useState('');
  const [bookTarget, setBookTarget] = useState<Marketer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['marketers', subRole, region, location, styleSort],
    queryFn: () =>
      marketersApi.getMarketers({ subRole: subRole || undefined, region: region || undefined, location: location || undefined, styleSort: styleSort || undefined })
        .then((r) => r.data),
  });

  const marketers: Marketer[] = data?.items ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Marketers</h1>
        <p className="text-textSecondary text-sm mt-1">Find models and content creators for your brand</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6" role="search" aria-label="Filter marketers">
        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          value={subRole}
          onChange={(e) => setSubRole(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All Marketers (Models &amp; Content Creators)</option>
          <option value="Model">Models</option>
          <option value="Content_Creator">Content Creators</option>
        </select>

        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          value={styleSort}
          onChange={(e) => setStyleSort(e.target.value)}
          aria-label="Sort by style preference"
        >
          <option value="">All styles</option>
          <option value="traditional">Traditional</option>
          <option value="non-traditional">Non-Traditional</option>
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

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-64 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && marketers.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <p className="font-medium">No marketers found</p>
          <p className="text-sm mt-1">Try different filters</p>
        </div>
      )}

      {!isLoading && marketers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {marketers.map((m) => (
            <MarketerCard key={m.id} marketer={m} onBook={setBookTarget} />
          ))}
        </div>
      )}

      {bookTarget && <BookingModal marketer={bookTarget} onClose={() => setBookTarget(null)} />}
    </div>
  );
}
