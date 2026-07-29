import { create } from 'zustand';
import type { TrainingProgram, TrainingApplication } from '@/types/models';

interface TrainingStore {
  myApplications: TrainingApplication[];
  enrolledPrograms: TrainingProgram[];
  setMyApplications: (apps: TrainingApplication[]) => void;
  addApplication: (app: TrainingApplication) => void;
  updateApplicationStatus: (appId: string, status: 'Accepted' | 'Rejected') => void;
}

export const useTrainingStore = create<TrainingStore>((set) => ({
  myApplications: [],
  enrolledPrograms: [],

  setMyApplications: (apps) => set({ myApplications: apps }),

  addApplication: (app) =>
    set((state) => ({ myApplications: [...state.myApplications, app] })),

  updateApplicationStatus: (appId, status) =>
    set((state) => ({
      myApplications: state.myApplications.map((a) =>
        a.id === appId ? { ...a, status } : a
      ),
    })),
}));
