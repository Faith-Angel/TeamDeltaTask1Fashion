'use client';

import Link from 'next/link';
import {
  ClipboardList, Grid, Users, BookOpen, Calendar,
  Briefcase, TrendingUp, Clock, CheckCircle, Scissors,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDesigner, useToggleAvailability } from '@/hooks/useDesigners';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

const quickLinks = [
  { href: '/designer/appointments', icon: <ClipboardList className="w-6 h-6" />, label: 'Appointments', description: 'Manage client fittings', color: 'bg-primary/10 text-primary' },
  { href: '/designer/portfolio', icon: <Grid className="w-6 h-6" />, label: 'Portfolio', description: 'Upload & manage your work', color: 'bg-accent/10 text-accent' },
  { href: '/designer/marketers', icon: <Users className="w-6 h-6" />, label: 'Marketers', description: 'Find models & creators', color: 'bg-primary/15 text-primaryDark' },
  { href: '/designer/training', icon: <BookOpen className="w-6 h-6" />, label: 'Training', description: 'Offer fashion programs', color: 'bg-accent/15 text-accent' },
  { href: '/designer/planner', icon: <Calendar className="w-6 h-6" />, label: 'Planner', description: 'Manage your schedule', color: 'bg-success/10 text-success' },
  { href: '/designer/collaborations', icon: <Briefcase className="w-6 h-6" />, label: 'Collaborations', description: 'Work with other designers', color: 'bg-accent/20 text-textSecondary' },
];

const AVAILABILITY_STYLES = {
  Available: 'bg-success/10 text-success border-success/20',
  Busy: 'bg-warning/10 text-warning border-warning/20',
  Unavailable: 'bg-error/10 text-error border-error/20',
};

export default function DesignerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: designer, isLoading } = useDesigner(user?.id || '');
  const { mutate: toggleAvailability, isPending: toggling } = useToggleAvailability(user?.id || '');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">
          Welcome, {user?.fullName?.split(' ')[0] || 'Designer'} ✂️
        </h1>
        <p className="text-textSecondary mt-1">Manage your fashion design business</p>
      </div>

      {/* Stats card */}
      {designer && (
        <div className="bg-surface rounded-xl border border-border p-5 mb-6" aria-label="Your profile stats">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">Your Status</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleAvailability()}
              disabled={toggling}
              aria-label={`Toggle availability (currently ${designer.availability})`}
              className={cn('border', AVAILABILITY_STYLES[designer.availability])}
            >
              {toggling ? 'Updating…' : designer.availability}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{designer.rankingScore.toFixed(1)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Rating</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{designer.completedFitsCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Completed Fits</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{designer.pendingAppointmentsCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Pending</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-muted rounded-xl h-32 animate-pulse mb-6" aria-hidden="true" />
      )}

      {/* Quick links */}
      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="text-lg font-semibold text-textPrimary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col gap-3 p-5 bg-surface rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all"
              aria-label={`${link.label}: ${link.description}`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${link.color}`} aria-hidden="true">
                {link.icon}
              </div>
              <div>
                <p className="font-semibold text-textPrimary text-sm">{link.label}</p>
                <p className="text-textSecondary text-xs mt-0.5">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
