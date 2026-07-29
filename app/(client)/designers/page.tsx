'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, MapPin, Star, CheckCircle } from 'lucide-react';
import { useDesigners, useSubmitReview } from '@/hooks/useDesigners';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services/apiClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, debounce } from '@/lib/utils';
import { CAMEROON_REGIONS, DESIGNER_SPECIALTIES, RATING_OPTIONS } from '@/lib/constants';
import type { Designer } from '@/types/models';
import { useRouter } from 'next/navigation';

const AVAILABILITY_COLORS: Record<Designer['availability'], string> = {
  Available: 'bg-success/10 text-success',
  Busy: 'bg-warning/10 text-warning',
  Unavailable: 'bg-error/10 text-error',
};

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${score} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i < Math.round(score) ? 'fill-accent text-accent' : 'text-border fill-border')}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs text-textSecondary ml-1">{score.toFixed(1)}</span>
    </div>
  );
}

function ReviewModal({
  designer,
  onClose,
}: {
  designer: Designer;
  onClose: () => void;
}) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const { mutate: submit, isPending, isSuccess } = useSubmitReview(designer.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Review ${designer.fullName}`}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-textPrimary mb-1">Rate Designer</h2>
        <p className="text-sm text-textSecondary mb-4">{designer.fullName}</p>

        {isSuccess ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" aria-hidden="true" />
            <p className="text-textPrimary font-medium">Review submitted!</p>
            <Button className="mt-4 w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 my-4" role="group" aria-label="Select rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`${s} star${s !== 1 ? 's' : ''}`}
                  aria-pressed={score === s}
                >
                  <Star
                    className={cn(
                      'w-8 h-8 transition-colors',
                      s <= (hovered || score) ? 'fill-accent text-accent' : 'text-border fill-border'
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-white"
                disabled={!score || isPending}
                onClick={() => submit(score)}
              >
                {isPending ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DesignerCard({
  designer,
  onReview,
  onMessage,
}: {
  designer: Designer;
  onReview: (d: Designer) => void;
  onMessage: (d: Designer) => void;
}) {
  const coverImage = designer.portfolioImages[0]?.url;

  return (
    <article
      className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
      aria-label={`Designer: ${designer.fullName}`}
    >
      {/* Cover / portfolio preview */}
      <div className="relative h-40 bg-muted">
        {coverImage ? (
          <Image src={coverImage} alt={`${designer.fullName}'s portfolio`} fill className="object-cover" sizes="350px" />
        ) : (
          <div className="h-full flex items-center justify-center text-textSecondary text-sm">No portfolio</div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={cn('text-xs font-medium border-0', AVAILABILITY_COLORS[designer.availability])}>
            {designer.availability}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <p className="font-semibold text-textPrimary">{designer.fullName}</p>
        <div className="flex items-center gap-1 text-xs text-textSecondary mt-0.5">
          <MapPin className="w-3 h-3" aria-hidden="true" />
          {designer.location}
        </div>

        <div className="mt-2">
          <StarRating score={designer.rankingScore} />
          <p className="text-xs text-textSecondary mt-0.5">{designer.reviewCount} reviews · {designer.completedFitsCount} fits</p>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onReview(designer)}
            aria-label={`Rate ${designer.fullName}`}
          >
            Rate
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary text-white text-xs"
            onClick={() => onMessage(designer)}
            disabled={designer.availability === 'Unavailable'}
            aria-label={`Message ${designer.fullName}`}
          >
            Message
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function DesignersPage() {
  const [region, setRegion] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('ranking');
  const [specialty, setSpecialty] = useState('');
  const [minRating, setMinRating] = useState('');
  const [availability, setAvailability] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<Designer | null>(null);

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { loadConversations } = useChatStore();

  const debouncedSetSearch = debounce((val: string) => setDebouncedSearch(val), 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useDesigners({
    location: location || undefined,
    region: region || undefined,
    sort,
    q: debouncedSearch || undefined,
    specialty: specialty || undefined,
    minRating: minRating || undefined,
    availability: availability || undefined,
  });

  const allDesigners = data?.pages.flatMap((p) => p.items) ?? [];

  const handleMessage = async (designer: Designer) => {
    try {
      await chatApi.createConversation(designer.id);
      await loadConversations();
      router.push('/chat');
    } catch {
      router.push('/chat');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Designers</h1>
        <p className="text-textSecondary text-sm mt-1">Find talented Cameroonian fashion designers</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3" role="search" aria-label="Filter designers">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" aria-hidden="true" />
          <Input
            className="pl-9"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSetSearch(e.target.value);
            }}
            aria-label="Search designers by name"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          {/* Region */}
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

          {/* City — only shown when region is selected */}
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

          {/* Specialty */}
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            aria-label="Filter by specialty"
          >
            <option value="">All Specialties</option>
            {DESIGNER_SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Rating */}
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            aria-label="Filter by minimum rating"
          >
            <option value="">Any Rating</option>
            {RATING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Availability */}
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            aria-label="Filter by availability"
          >
            <option value="">Any Availability</option>
            <option value="Available">Available Now</option>
            <option value="Busy">Busy</option>
          </select>

          {/* Sort */}
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort designers"
          >
            <option value="ranking">Top Rated</option>
            <option value="fits">Most Fits</option>
            <option value="recent">Newest</option>
            <option value="traditional">Traditional Style</option>
            <option value="non-traditional">Non-Traditional / Contemporary</option>
          </select>

          {/* Active filter chips + clear */}
          {(region || location || specialty || minRating || availability || sort !== 'ranking' || debouncedSearch) && (
            <button
              onClick={() => {
                setRegion(''); setLocation(''); setSpecialty('');
                setMinRating(''); setAvailability(''); setSort('ranking');
                setSearch(''); setDebouncedSearch('');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading designers">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-64 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <>
          {allDesigners.length === 0 ? (
            <div className="text-center py-16 text-textSecondary">
              <p className="text-lg font-medium">No designers found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allDesigners.map((d) => (
                <DesignerCard
                  key={d.id}
                  designer={d}
                  onReview={setReviewTarget}
                  onMessage={handleMessage}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                aria-label="Load more designers"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      {reviewTarget && (
        <ReviewModal designer={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}
    </div>
  );
}
