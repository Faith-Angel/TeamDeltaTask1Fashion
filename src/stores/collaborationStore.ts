import { create } from 'zustand';
import type { CollaborationProject, CollaborationInvitation, WorkspaceNote, WorkspaceFile, WorkspaceUpdate } from '@/types/models';

interface CollaborationStore {
  projects: CollaborationProject[];
  activeProject: CollaborationProject | null;
  invitations: CollaborationInvitation[];
  workspaceNotes: WorkspaceNote[];
  workspaceFiles: WorkspaceFile[];
  workspaceUpdates: WorkspaceUpdate[];

  setProjects: (projects: CollaborationProject[]) => void;
  setActiveProject: (project: CollaborationProject | null) => void;
  addProject: (project: CollaborationProject) => void;
  setInvitations: (invitations: CollaborationInvitation[]) => void;
  updateInvitation: (id: string, status: 'Accepted' | 'Declined') => void;
  setWorkspaceNotes: (notes: WorkspaceNote[]) => void;
  addNote: (note: WorkspaceNote) => void;
  setWorkspaceFiles: (files: WorkspaceFile[]) => void;
  addFile: (file: WorkspaceFile) => void;
  setWorkspaceUpdates: (updates: WorkspaceUpdate[]) => void;
  addUpdate: (update: WorkspaceUpdate) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  projects: [],
  activeProject: null,
  invitations: [],
  workspaceNotes: [],
  workspaceFiles: [],
  workspaceUpdates: [],

  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  setInvitations: (invitations) => set({ invitations }),
  updateInvitation: (id, status) =>
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === id ? { ...inv, status } : inv
      ),
    })),
  setWorkspaceNotes: (notes) => set({ workspaceNotes: notes }),
  addNote: (note) =>
    set((state) => ({ workspaceNotes: [note, ...state.workspaceNotes] })),
  setWorkspaceFiles: (files) => set({ workspaceFiles: files }),
  addFile: (file) =>
    set((state) => ({ workspaceFiles: [file, ...state.workspaceFiles] })),
  setWorkspaceUpdates: (updates) => set({ workspaceUpdates: updates }),
  addUpdate: (update) =>
    set((state) => ({ workspaceUpdates: [update, ...state.workspaceUpdates] })),
}));
