import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'fr';
export type Theme = 'light' | 'dark';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIStore {
  language: Language;
  theme: Theme;
  toasts: Toast[];
  sidebarOpen: boolean;

  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      theme: 'light',
      toasts: [],
      sidebarOpen: false,

      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Auto-remove after duration (default 4s)
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 4000);
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      clearToasts: () => set({ toasts: [] }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ndolostitch-ui',
      partialize: (state) => ({ language: state.language, theme: state.theme }),
    }
  )
);
