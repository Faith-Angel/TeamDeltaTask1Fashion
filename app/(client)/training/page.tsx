'use client';

import { useState } from 'react';
import { BookOpen, MapPin, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useTrainingPrograms, useApplyToProgram } from '@/hooks/useTraining';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatXAF, formatDate } from '@/lib/utils';
import type { TrainingProgram } from '@/types/models';

const DURATION_LABELS: Record<TrainingProgram['durationCategory'], string> = {
  'short-term': 'Short-term (3–6 months)',
  'long-term': 'Long-term (1–2 years)',
};

function ProgramCard({ program }: { program: TrainingProgram }) {
  const { mutate: apply, isPending, isSuccess } = useApplyToProgram();
  const spotsLeft = program.maxCapacity - program.enrolledCount;
  const isFull = spotsLeft <= 0;

  return (
    <article
      className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
      aria-label={program.title}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-textPrimary">{program.title}</p>
          <p className="text-sm text-textSecondary mt-0.5">by {program.designerName}</p>
        </div>
        <Badge
          className={cn(
            'text-xs border-0 flex-shrink-0',
            program.durationCategory === 'short-term'
              ? 'bg-accent/10 text-accent'
              : 'bg-primary/10 text-primary'
          )}
        >
          {program.durationCategory === 'short-term' ? 'Short-term' : 'Long-term'}
        </Badge>
      </div>

      <p className="text-sm text-textSecondary line-clamp-2 mb-4">{program.description}</p>

      <dl className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="flex items-center gap-1.5 text-textSecondary">
          <Calendar className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <dt className="sr-only">Start date</dt>
          <dd>{formatDate(program.startDate)}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-textSecondary">
          <Users className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <dt className="sr-only">Spots left</dt>
          <dd className={cn(isFull ? 'text-error' : spotsLeft <= 5 ? 'text-warning' : '')}>
            {isFull ? 'Full' : `${spotsLeft} spots left`}
          </dd>
        </div>
        <div className="flex items-center gap-1.5 text-textSecondary">
          <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <dt className="sr-only">Duration</dt>
          <dd>{DURATION_LABELS[program.durationCategory]}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <dt className="sr-only">Price</dt>
          <dd className="font-semibold text-primary">{formatXAF(program.price)}</dd>
        </div>
      </dl>

      {program.timetable && (
        <p className="text-xs text-textSecondary bg-muted rounded-lg px-3 py-2 mb-4">
          <span className="font-medium">Schedule:</span> {program.timetable}
        </p>
      )}

      {isSuccess ? (
        <div className="flex items-center gap-2 text-success text-sm font-medium">
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          Application submitted!
        </div>
      ) : (
        <Button
          className={cn('w-full', isFull ? '' : 'bg-primary text-white')}
          disabled={isFull || isPending}
          onClick={() => apply(program.id)}
          aria-label={`Apply to ${program.title}`}
        >
          {isPending ? 'Applying…' : isFull ? 'Program Full' : 'Apply Now'}
        </Button>
      )}
    </article>
  );
}

export default function TrainingPage() {
  const [filter, setFilter] = useState<'' | 'short-term' | 'long-term'>('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTrainingPrograms();

  const allPrograms = (data?.pages.flatMap((p) => p.items) ?? []).filter(
    (p) => p.status === 'Published' && (!filter || p.durationCategory === filter)
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Training Programs</h1>
        <p className="text-textSecondary text-sm mt-1">Learn fashion design from Cameroonian experts</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Filter by duration">
        {(['', 'short-term', 'long-term'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px]',
              filter === f
                ? 'bg-primary text-white'
                : 'bg-muted text-textSecondary hover:bg-primary/10 hover:text-primary'
            )}
          >
            {f === '' ? '📚 All' : f === 'short-term' ? '⏱ Short-term' : '📅 Long-term'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading programs">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-48 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <>
          {allPrograms.length === 0 ? (
            <div className="text-center py-16 text-textSecondary">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
              <p className="font-medium">No programs available</p>
              <p className="text-sm">Check back soon for new training programs</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {allPrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
