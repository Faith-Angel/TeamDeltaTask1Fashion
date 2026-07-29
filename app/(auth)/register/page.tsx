'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NdoloLogo } from '@/components/ui/NdoloLogo';
import { useAuth } from '@/hooks/useAuth';
import { registrationSchema, type RegistrationInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CAMEROON_LOCATIONS } from '@/lib/constants';
import axios from 'axios';

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegistrationInput) => {
    setServerError('');

    try {
      const { confirmPassword, ...registrationData } = data;
      const user = await registerUser(registrationData as unknown as Record<string, unknown>);

      const roleRoutes: Record<string, string> = {
        Client: '/dashboard',
        Designer: '/designer/dashboard',
        Vendor: '/vendor/dashboard',
        Marketer: '/marketer/dashboard',
      };

      router.replace(roleRoutes[user.role] || '/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setServerError('A user with this email address already exists');
        } else {
          setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <NdoloLogo size="lg" />
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-textPrimary mb-6">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-textPrimary mb-1">
                Full Name
              </label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                autoComplete="name"
                aria-label="Full name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                {...register('fullName')}
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-error text-xs mt-1" role="alert">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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
                placeholder="Min 8 characters"
                autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-textPrimary mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                aria-label="Confirm password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-error text-xs mt-1" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-textPrimary mb-1">
                Location
              </label>
              <select
                id="location"
                className="w-full min-h-[44px] px-3 py-2 border border-border rounded-lg bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Your city or region"
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? 'location-error' : undefined}
                {...register('location')}
              >
                <option value="">Select your location</option>
                {CAMEROON_LOCATIONS.map((loc, index) => (
                  <option key={`${loc}-${index}`} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p id="location-error" className="text-error text-xs mt-1" role="alert">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Client', 'Designer', 'Vendor', 'Marketer'] as const).map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    aria-label={`Select role: ${role}`}
                  >
                    <input
                      type="radio"
                      value={role}
                      className="text-primary"
                      aria-label={role}
                      {...register('role')}
                    />
                    <span className="text-sm font-medium">{role}</span>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="text-error text-xs mt-1" role="alert">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Marketer Sub-Role */}
            {selectedRole === 'Marketer' && (
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">Marketer Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Model', 'Content_Creator'] as const).map((subRole) => (
                    <label
                      key={subRole}
                      className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      aria-label={`Select marketer type: ${subRole === 'Content_Creator' ? 'Content Creator' : subRole}`}
                    >
                      <input
                        type="radio"
                        value={subRole}
                        className="text-primary"
                        aria-label={subRole === 'Content_Creator' ? 'Content Creator' : subRole}
                        {...register('marketerSubRole')}
                      />
                      <span className="text-sm font-medium">
                        {subRole === 'Content_Creator' ? 'Content Creator' : subRole}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.marketerSubRole && (
                  <p className="text-error text-xs mt-1" role="alert">
                    {errors.marketerSubRole.message}
                  </p>
                )}
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div role="alert" className="text-sm p-3 rounded-lg bg-error/10 text-error border border-error/20">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white"
              aria-label="Create your account"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-textSecondary mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline" aria-label="Go to sign in page">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

