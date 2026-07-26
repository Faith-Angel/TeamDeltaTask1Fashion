'use client';

import Link from 'next/link';
import { Grid, Users, ShoppingBag, MessageCircle, BookOpen, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const quickLinks = [
  {
    href: '/feed',
    icon: <Grid className="w-6 h-6" />,
    label: 'Inspiration Feed',
    description: 'Browse fashion inspirations',
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/designers',
    icon: <Users className="w-6 h-6" />,
    label: 'Designers',
    description: 'Find talented designers',
    color: 'bg-accent/10 text-accent',
  },
  {
    href: '/marketplace',
    icon: <ShoppingBag className="w-6 h-6" />,
    label: 'Marketplace',
    description: 'Shop fashion products',
    color: 'bg-success/10 text-success',
  },
  {
    href: '/chat',
    icon: <MessageCircle className="w-6 h-6" />,
    label: 'Messages',
    description: 'Chat with designers',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    href: '/training',
    icon: <BookOpen className="w-6 h-6" />,
    label: 'Training',
    description: 'Fashion training programs',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    href: '/feed',
    icon: <Sparkles className="w-6 h-6" />,
    label: 'AI Outfit Generator',
    description: 'Create outfits with AI',
    color: 'bg-pink-100 text-pink-700',
  },
];

export default function ClientDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">
          Welcome back, {user?.fullName?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-textSecondary mt-1">Explore Cameroon&apos;s fashion ecosystem</p>
      </div>

      {/* Quick Links Grid */}
      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="text-lg font-semibold text-textPrimary mb-4">
          What would you like to do?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="flex flex-col gap-3 p-5 bg-surface rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all min-h-[44px]"
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
