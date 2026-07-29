'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, isGuest, isLoading, setUser, setGuest, logout, login, register, restoreSession } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    return login(email, password);
  };

  const handleRegister = async (data: Record<string, unknown>) => {
    return register(data);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const enterGuestMode = () => {
    setGuest(true);
    router.push('/guest/feed');
  };

  return {
    user,
    isGuest,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    logout: handleLogout,
    login: handleLogin,
    register: handleRegister,
    restoreSession,
    enterGuestMode,
  };
}

