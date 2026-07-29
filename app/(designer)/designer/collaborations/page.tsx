'use client';

import { useState } from 'react';
import { Briefcase, Plus, Users, Calendar, CheckCircle, FileText, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  useCollaborationProjects,
  useCreateCollaborationProject,
  useWorkspaceNotes,
  useAddNote,
  useWorkspaceUpdates,
  usePostUpdate,
} from '@/hooks/useCollaboration';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collaborationProjectSchema, workspaceNoteSchema, workspaceUpdateSchema, type CollaborationProjectInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, timeAgo } from '@/lib/utils';
import type { CollaborationProject } from '@/types/models';

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending, isSuccess } = useCreateCollaborationProject();
  const { register, handleSubmit, formState: { errors } } = useForm<CollaborationProjectInput>({
    resolver: zodResolver(collaborationProjectSchema),
  });

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-textPrimary">Project created!</p>
          <Button className="mt-5 w-full bg-primary text-white" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Create collaboration project">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-textPrimary">New Collaboration</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit((data) => create(data))} className="p-5 space-y-4">
          <div>
            <label htmlFor="col-title" className="block text-sm font-medium text-textPrimary mb-1">Project Title</label>
            <Input id="col-title" placeholder="e.g. Afrocentric Summer Collection" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && <p className="text-error text-xs mt-1" role="alert">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="col-desc" className="block text-sm font-medium text-textPrimary mb-1">Description</label>
            <textarea id="col-desc" rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="What is this collaboration about?" aria-invalid={!!errors.description} {...register('description')} />
            {errors.description && <p className="text-error text-xs mt-1" role="alert">{errors.description.message}</p>}
          </div>

          <div>
            <label htmlFor="col-skills" className="block text-sm font-medium text-textPrimary mb-1">Required Skills</label>
            <Input id="col-skills" placeholder="e.g. Pattern making, Photography, Embroidery" aria-invalid={!!errors.requiredSkills} {...register('requiredSkills')} />
            {errors.requiredSkills && <p className="text-error text-xs mt-1" role="alert">{errors.requiredSkills.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="col-deadline" className="block text-sm font-medium text-textPrimary mb-1">Deadline</label>
              <Input id="col-deadline" type="date" aria-invalid={!!errors.deadline} {...register('deadline')} />
              {errors.deadline && <p className="text-error text-xs mt-1" role="alert">{errors.deadline.message}</p>}
            </div>
            <div>
              <label htmlFor="col-slots" className="block text-sm font-medium text-textPrimary mb-1">Collaborator Slots</label>
              <Input id="col-slots" type="number" min={1} max={20} placeholder="3" aria-invalid={!!errors.collaboratorSlots} {...register('collaboratorSlots', { valueAsNumber: true })} />
              {errors.collaboratorSlots && <p className="text-error text-xs mt-1" role="alert">{errors.collaboratorSlots.message}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkspacePanel({ project }: { project: CollaborationProject }) {
  const [tab, setTab] = useState<'notes' | 'updates'>('notes');
  const [noteText, setNoteText] = useState('');
  const [updateText, setUpdateText] = useState('');

  const { data: notesData } = useWorkspaceNotes(project.id);
  const { mutate: addNote, isPending: addingNote } = useAddNote(project.id);
  const { data: updatesData } = useWorkspaceUpdates(project.id);
  const { mutate: postUpdate, isPending: postingUpdate } = usePostUpdate(project.id);

  const notes = notesData?.items ?? [];
  const updates = updatesData?.items ?? [];

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex gap-2 mb-3" role="tablist">
        <button role="tab" aria-selected={tab === 'notes'} onClick={() => setTab('notes')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px]', tab === 'notes' ? 'bg-primary text-white' : 'bg-muted text-textSecondary')}>
          Notes
        </button>
        <button role="tab" aria-selected={tab === 'updates'} onClick={() => setTab('updates')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px]', tab === 'updates' ? 'bg-primary text-white' : 'bg-muted text-textSecondary')}>
          Updates
        </button>
      </div>

      {tab === 'notes' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" className="flex-1 text-sm" aria-label="Note content" />
            <Button size="sm" className="bg-primary text-white" disabled={!noteText.trim() || addingNote}
              onClick={() => { addNote(noteText.trim()); setNoteText(''); }}>
              Add
            </Button>
          </div>
          {notes.length === 0 && <p className="text-xs text-textSecondary text-center py-3">No notes yet</p>}
          {notes.map((n: { id: string; content: string; authorName: string; createdAt: string }) => (
            <div key={n.id} className="bg-muted rounded-lg px-3 py-2">
              <p className="text-sm text-textPrimary">{n.content}</p>
              <p className="text-xs text-textSecondary mt-0.5">{n.authorName} · {timeAgo(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'updates' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={updateText} onChange={(e) => setUpdateText(e.target.value)} placeholder="Post an update…" className="flex-1 text-sm" aria-label="Update content" />
            <Button size="sm" className="bg-primary text-white" disabled={!updateText.trim() || postingUpdate}
              onClick={() => { postUpdate(updateText.trim()); setUpdateText(''); }}>
              Post
            </Button>
          </div>
          {updates.length === 0 && <p className="text-xs text-textSecondary text-center py-3">No updates yet</p>}
          {updates.map((u: { id: string; content: string; authorName: string; createdAt: string }) => (
            <div key={u.id} className="bg-muted rounded-lg px-3 py-2">
              <p className="text-sm text-textPrimary">{u.content}</p>
              <p className="text-xs text-textSecondary mt-0.5">{u.authorName} · {timeAgo(u.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: CollaborationProject }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="bg-surface rounded-xl border border-border p-5" aria-label={project.title}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-semibold text-textPrimary">{project.title}</p>
        <Badge className={cn('text-xs border-0', project.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-textSecondary')}>
          {project.status}
        </Badge>
      </div>

      <p className="text-sm text-textSecondary line-clamp-2 mb-3">{project.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textSecondary mb-3">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Deadline: {formatDate(project.deadline)}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.participants.length}/{project.collaboratorSlots} collaborators</span>
      </div>

      <div className="bg-muted rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-textSecondary"><span className="font-medium">Skills:</span> {project.requiredSkills}</p>
      </div>

      <Button size="sm" variant="outline" className="text-xs" onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Open'} workspace for ${project.title}`}>
        {expanded ? 'Close Workspace' : 'Open Workspace'}
      </Button>

      {expanded && <WorkspacePanel project={project} />}
    </article>
  );
}

export default function DesignerCollaborationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useCollaborationProjects();

  const projects = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Collaborations</h1>
          <p className="text-textSecondary text-sm mt-1">Partner with other designers on joint collections</p>
        </div>
        <Button className="bg-primary text-white gap-2" onClick={() => setShowCreate(true)} aria-label="Create new collaboration">
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Project
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-44 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-textSecondary">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No collaborations yet</p>
          <p className="text-sm mt-1">Create a project to start collaborating with other designers</p>
          <Button className="mt-4 bg-primary text-white" onClick={() => setShowCreate(true)}>Start Collaborating</Button>
        </div>
      )}

      {!isLoading && projects.length > 0 && (
        <div className="space-y-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
