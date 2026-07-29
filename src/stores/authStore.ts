import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/models';
import { authApi } from '@/services/apiClient';
import { createClientSideClient } from '@/lib/supabase/client';

function normalizeAuthUser(user: Partial<User> | null | undefined): User {
  if (!user) {
    throw new Error('No user returned from auth service');
  }

  const role = user.role ?? 'Client';

  return {
    id: user.id ?? '',
    fullName: user.fullName ?? 'User',
    email: user.email ?? '',
    location: user.location ?? '',
    role: role as User['role'],
    marketerSubRole: user.marketerSubRole,
    failedLoginAttempts: user.failedLoginAttempts ?? 0,
    lockedUntil: user.lockedUntil,
    pushToken: user.pushToken,
    createdAt: user.createdAt ?? new Date().toISOString(),
    updatedAt: user.updatedAt ?? new Date().toISOString(),
  } as User;
}

async function persistSupabaseSession(session: { accessToken?: string; refreshToken?: string } | undefined) {
  console.log('=== SESSION FROM API ===', session);
  if (!session?.accessToken || !session?.refreshToken) {
    console.log('=== NO TOKENS FOUND, SKIPPING setSession ===');
    return;
  }
  const supabase = createClientSideClient();
  const { error } = await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });
  console.log('=== setSession RESULT ===', error ? error : 'SUCCESS');
}

interface AuthStore {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setGuest: (val: boolean) => void;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
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

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          console.log('=== FULL LOGIN RESPONSE ===', JSON.stringify(response.data, null, 2));
          const user = normalizeAuthUser(response.data?.user ?? response.data);
          await persistSupabaseSession(response.data?.session);
          set({ user, isGuest: false, isLoading: false });
          return user;
        } catch (error) {
          console.log('=== LOGIN ERROR ===', error);
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const user = normalizeAuthUser(response.data?.user ?? response.data);
          await persistSupabaseSession(response.data?.session);
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