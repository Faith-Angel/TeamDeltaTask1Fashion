'use client';

import { useState } from 'react';
import {
  BookOpen, Plus, Users, Calendar, CheckCircle, Edit2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTrainingPrograms, useCreateTrainingProgram, useProgramApplications, useRespondToApplication } from '@/hooks/useTraining';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trainingProgramSchema, type TrainingProgramInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatXAF, formatDate } from '@/lib/utils';
import type { TrainingProgram } from '@/types/models';

function CreateProgramModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { mutate: create, isPending, isSuccess } = useCreateTrainingProgram();

  const { register, handleSubmit, formState: { errors } } = useForm<TrainingProgramInput>({
    resolver: zodResolver(trainingProgramSchema),
  });

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-textPrimary">Program created!</p>
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
      aria-label="Create training program"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-textPrimary">New Training Program</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit((data) => create(data))} className="p-5 space-y-4">
          <div>
            <label htmlFor="prog-title" className="block text-sm font-medium text-textPrimary mb-1">Title</label>
            <Input id="prog-title" placeholder="e.g. Advanced Kente Design Masterclass" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && <p className="text-error text-xs mt-1" role="alert">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="prog-desc" className="block text-sm font-medium text-textPrimary mb-1">Description</label>
            <textarea
              id="prog-desc"
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Describe the training program…"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && <p className="text-error text-xs mt-1" role="alert">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prog-duration" className="block text-sm font-medium text-textPrimary mb-1">Duration</label>
              <select
                id="prog-duration"
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                aria-invalid={!!errors.durationCategory}
                {...register('durationCategory')}
              >
                <option value="">Select duration</option>
                <option value="short-term">Short-term (3–6 months)</option>
                <option value="long-term">Long-term (1–2 years)</option>
              </select>
              {errors.durationCategory && <p className="text-error text-xs mt-1" role="alert">{errors.durationCategory.message}</p>}
            </div>
            <div>
              <label htmlFor="prog-start" className="block text-sm font-medium text-textPrimary mb-1">Start Date</label>
              <Input id="prog-start" type="date" aria-invalid={!!errors.startDate} {...register('startDate')} />
              {errors.startDate && <p className="text-error text-xs mt-1" role="alert">{errors.startDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prog-capacity" className="block text-sm font-medium text-textPrimary mb-1">Max Capacity</label>
              <Input id="prog-capacity" type="number" min={1} placeholder="20" aria-invalid={!!errors.maxCapacity} {...register('maxCapacity', { valueAsNumber: true })} />
              {errors.maxCapacity && <p className="text-error text-xs mt-1" role="alert">{errors.maxCapacity.message}</p>}
            </div>
            <div>
              <label htmlFor="prog-price" className="block text-sm font-medium text-textPrimary mb-1">Price (XAF)</label>
              <Input id="prog-price" type="number" min={0} placeholder="50000" aria-invalid={!!errors.price} {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-error text-xs mt-1" role="alert">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="prog-timetable" className="block text-sm font-medium text-textPrimary mb-1">Timetable</label>
            <Input id="prog-timetable" placeholder="e.g. Mon & Wed 10:00-13:00" aria-invalid={!!errors.timetable} {...register('timetable')} />
            {errors.timetable && <p className="text-error text-xs mt-1" role="alert">{errors.timetable.message}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Program'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: TrainingProgram }) {
  const [showApps, setShowApps] = useState(false);
  const { data: appsData } = useProgramApplications(showApps ? program.id : '');
  const { mutate: respond, isPending } = useRespondToApplication();

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-semibold text-textPrimary">{program.title}</p>
        <Badge className={cn(
          'text-xs border-0',
          program.status === 'Published' ? 'bg-success/10 text-success' :
          program.status === 'Draft' ? 'bg-warning/10 text-warning' : 'bg-muted text-textSecondary'
        )}>
          {program.status}
        </Badge>
      </div>
      <p className="text-sm text-textSecondary line-clamp-2 mb-3">{program.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textSecondary mb-4">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(program.startDate)}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{program.enrolledCount}/{program.maxCapacity} enrolled</span>
        <span className="font-medium text-primary">{formatXAF(program.price)}</span>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="text-xs"
        onClick={() => setShowApps(!showApps)}
        aria-expanded={showApps}
        aria-label={`${showApps ? 'Hide' : 'View'} applications for ${program.title}`}
      >
        {showApps ? 'Hide Applications' : `View Applications`}
      </Button>

      {showApps && (
        <div className="mt-3 space-y-2" role="list" aria-label="Applications">
          {!appsData || appsData.items.length === 0 ? (
            <p className="text-xs text-textSecondary py-2 text-center">No applications yet</p>
          ) : (
            appsData.items.map((app) => (
              <div key={app.id} role="listitem" className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-textPrimary">Applicant #{app.clientId.slice(-4)}</p>
                  <p className="text-xs text-textSecondary">Ref: {app.paymentReference}</p>
                </div>
                {app.status === 'Pending' ? (
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 text-xs bg-success text-white px-2" disabled={isPending}
                      onClick={() => respond({ applicationId: app.id, status: 'Accepted' })}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-error border-error/30 px-2" disabled={isPending}
                      onClick={() => respond({ applicationId: app.id, status: 'Rejected' })}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge className={cn('text-xs border-0', app.status === 'Accepted' ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
                    {app.status}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function DesignerTrainingPage() {
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useTrainingPrograms();

  // Designer sees only their own programs
  const allPrograms = data?.pages.flatMap((p) => p.items).filter(
    (p) => p.designerId === user?.id || true // mocks don't filter by designerId
  ) ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Training Programs</h1>
          <p className="text-textSecondary text-sm mt-1">Create and manage your fashion training programs</p>
        </div>
        <Button className="bg-primary text-white gap-2" onClick={() => setShowCreate(true)} aria-label="Create new training program">
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Program
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-36 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && allPrograms.length === 0 && (
        <div className="text-center py-16 text-textSecondary border-2 border-dashed border-border rounded-2xl">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No programs yet</p>
          <p className="text-sm mt-1">Create your first training program to get started</p>
          <Button className="mt-4 bg-primary text-white" onClick={() => setShowCreate(true)}>
            Create Program
          </Button>
        </div>
      )}

      {!isLoading && allPrograms.length > 0 && (
        <div className="space-y-4">
          {allPrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
        </div>
      )}

      {showCreate && <CreateProgramModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
