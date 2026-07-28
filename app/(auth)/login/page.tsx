'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { NdoloLogo } from '@/components/ui/NdoloLogo';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const { login, enterGuestMode, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
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
      await login(data.phone, data.password);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 423) {
          const until = new Date(err.response.data?.lockedUntil);
          setLockedUntil(until);
          const mins = Math.ceil((until.getTime() - Date.now()) / 60000);
          setServerError(`Account locked for ${mins} minute(s) due to too many failed attempts`);
        } else {
          setServerError('Invalid phone number or password');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-textPrimary mb-1">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+237XXXXXXXXX"
                autoComplete="tel"
                aria-label="Phone number in format +237XXXXXXXXX"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                {...register('phone')}
              />
              {errors.phone && (
                <p id="phone-error" className="text-error text-xs mt-1" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-label="Password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary min-h-[auto] min-w-[auto]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
