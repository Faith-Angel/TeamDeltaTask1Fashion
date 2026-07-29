'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { NdoloLogo } from '@/components/ui/NdoloLogo';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, enterGuestMode, isLoading } = useAuth();
  const [serverError, setServerError] = useState('');
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    setLockedUntil(null);

    try {
      const user = await login(data.email, data.password);
      const roleRoutes: Record<string, string> = {
        Client: '/dashboard' ,
        Designer: '/designer/dashboard',
        Vendor: '/vendor/dashboard',
        Marketer: '/marketer/dashboard',
      };
      router.replace(roleRoutes[user.role] || '/dashboard');
    } catch (err) {
      const responseStatus = axios.isAxiosError(err) ? err.response?.status : undefined;

      if (responseStatus === 423) {
        const until = new Date((err as { response?: { data?: { lockedUntil?: string } } }).response?.data?.lockedUntil ?? Date.now());
        setLockedUntil(until);
        const mins = Math.ceil((until.getTime() - Date.now()) / 60000);
        setServerError(`Account locked for ${mins} minute(s) due to too many failed attempts`);
      } else if (responseStatus === 409) {
        setServerError('This email is already registered. Please sign in.');
      } else {
        setServerError('Invalid email or password. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <NdoloLogo size="lg" />
          </div>
          <p className="text-textSecondary mt-1">Cameroon&apos;s Fashion Platform</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-textPrimary mb-6">Welcome Back</h2>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(onSubmit)(event);
            }}
            noValidate
            className="space-y-4"
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                aria-label="Email address"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-error text-xs mt-1" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-label="Password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-error text-xs mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className={`text-sm p-3 rounded-lg ${
                  lockedUntil
                    ? 'bg-warning/10 text-warning border border-warning/30'
                    : 'bg-error/10 text-error border border-error/20'
                }`}
              >
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white"
              aria-label="Sign in to your account"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-textSecondary">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={enterGuestMode}
            className="w-full border-border text-textSecondary hover:bg-muted"
            aria-label="Browse as guest without signing in"
          >
            Browse as Guest
          </Button>
        </div>

        <p className="text-center text-sm text-textSecondary mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline" aria-label="Go to sign up page">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

