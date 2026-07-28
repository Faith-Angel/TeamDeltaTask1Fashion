'use client';

import Link from 'next/link';
import { Grid, Calendar, Camera, Video } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { marketersApi } from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';

const quickLinks = [
  {
    href: '/marketer/portfolio',
    icon: <Grid className="w-6 h-6" />,
    label: 'Portfolio',
    description: 'Manage your media files',
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/marketer/bookings',
    icon: <Calendar className="w-6 h-6" />,
    label: 'Bookings',
    description: 'View and respond to bookings',
    color: 'bg-accent/10 text-accent',
  },
];

export default function MarketerDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings', 'marketer'],
    queryFn: () => marketersApi.getBookings().then((r) => r.data),
  });

  const bookings = bookingsData?.items ?? [];
  const pendingBookings = bookings.filter((b: { status: string }) => b.status === 'Pending').length;
  const confirmedBookings = bookings.filter((b: { status: string }) => b.status === 'Confirmed').length;

  const isModel = user?.marketerSubRole === 'Model';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero banner */}
      {isModel ? (
        <div className="mb-8 rounded-2xl bg-primary/10 border border-primary/20 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Camera className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Model Portfolio</h1>
            <p className="text-sm text-textSecondary mt-0.5">
              Showcase your modeling work and get discovered by designers
            </p>
          </div>
          <Badge className="ml-auto bg-primary/10 text-primary border-0 text-xs flex items-center gap-1 flex-shrink-0">
            <Camera className="w-3 h-3" aria-hidden="true" /> Model
          </Badge>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl bg-accent/10 border border-accent/20 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Video className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-accent">Content Creator Portfolio</h1>
            <p className="text-sm text-textSecondary mt-0.5">
              Share your content creation work and connect with fashion designers
            </p>
          </div>
          <Badge className="ml-auto bg-accent/10 text-accent border-0 text-xs flex items-center gap-1 flex-shrink-0">
            <Video className="w-3 h-3" aria-hidden="true" /> Content Creator
          </Badge>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-textPrimary">
          Welcome, {user?.fullName?.split(' ')[0] || 'Marketer'}{' '}
          {isModel ? '📸' : '🎬'}
        </h2>
        <p className="text-textSecondary mt-1">Your marketing dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-border p-4 text-center" aria-label="Pending bookings">
          <p className="text-2xl font-bold text-primary">{pendingBookings}</p>
          <p className="text-xs text-textSecondary mt-0.5">Pending Bookings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center" aria-label="Confirmed bookings">
          <p className="text-2xl font-bold text-success">{confirmedBookings}</p>
          <p className="text-xs text-textSecondary mt-0.5">Confirmed Bookings</p>
        </div>
      </div>

      {/* Quick links */}
      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="text-lg font-semibold text-textPrimary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-5 bg-surface rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all"
              aria-label={`${link.label}: ${link.description}`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${link.color}`}
                aria-hidden="true"
              >
                {link.icon}
              </div>
              <div>
                <p className="font-semibold text-textPrimary">{link.label}</p>
                <p className="text-textSecondary text-sm mt-0.5">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {pendingBookings > 0 && (
        <div
          className="mt-6 bg-accent/10 border border-accent/20 rounded-xl p-4"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-accent">
            You have {pendingBookings} pending booking{pendingBookings !== 1 ? 's' : ''} awaiting your response.
          </p>
          <Link
            href="/marketer/bookings"
            className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
          >
            View bookings →
          </Link>
        </div>
      )}
    </div>
  );
}
