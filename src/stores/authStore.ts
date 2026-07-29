import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/models';
import { authApi } from '@/services/apiClient';

interface AuthStore {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setGuest: (val: boolean) => void;
  logout: () => Promise<void>;
  login: (phone: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<User>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isGuest: false,
      isLoading: false,

      setUser: (user) => set({ user, isGuest: false }),
      setGuest: (val) => set({ isGuest: val, user: val ? null : get().user }),

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        }
        set({ user: null, isGuest: false });
      },

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ phone, password });
          const { user } = response.data;
          set({ user, isGuest: false, isLoading: false });
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user } = response.data;
          set({ user, isGuest: false, isLoading: false });
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      restoreSession: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.refresh();
          if (response.data?.user) {
            set({ user: response.data.user, isGuest: false, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'ndolostitch-auth',
      partialize: (state) => ({ user: state.user, isGuest: state.isGuest }),
    }
  )
);
