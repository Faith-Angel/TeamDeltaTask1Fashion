'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, isGuest, isLoading, setUser, setGuest, logout, login, register, restoreSession } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (phone: string, password: string) => {
    const user = await login(phone, password);
    // Navigate to role-specific dashboard
    const roleRoutes: Record<string, string> = {
      Client: '/dashboard',
      Designer: '/designer/dashboard',
      Vendor: '/vendor/dashboard',
      Marketer: '/marketer/dashboard',
    };
    router.push(roleRoutes[user.role] || '/dashboard');
    return user;
  };

  const handleRegister = async (data: Record<string, unknown>) => {
    const user = await register(data);
    const roleRoutes: Record<string, string> = {
      Client: '/dashboard',
      Designer: '/designer/dashboard',
      Vendor: '/vendor/dashboard',
      Marketer: '/marketer/dashboard',
    };
    router.push(roleRoutes[user.role] || '/dashboard');
    return user;
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
