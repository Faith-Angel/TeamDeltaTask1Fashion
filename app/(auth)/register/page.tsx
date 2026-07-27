'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { registrationSchema, type RegistrationInput } from '@/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CAMEROON_LOCATIONS } from '@/lib/constants';
import axios from 'axios';

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
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
      await registerUser(data as Record<string, unknown>);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setServerError('A user with this phone number already exists');
        } else {
          setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Leaf className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-primary">ndolostitch</h1>
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
                {CAMEROON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  aria-label="Password, minimum 8 characters"
                  aria-invalid={!!errors.password}
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
                <p className="text-error text-xs mt-1" role="alert">
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
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-error text-xs mt-1" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

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
