'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Grid, ShoppingBag, MessageCircle, BookOpen,
  Calendar, Briefcase, Package, ClipboardList,
  Users, Star, LogOut, X, Scissors
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const clientNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { href: '/feed', label: 'Inspiration Feed', icon: <Grid className="h-5 w-5" /> },
  { href: '/designers', label: 'Designers', icon: <Star className="h-5 w-5" /> },
  { href: '/marketplace', label: 'Marketplace', icon: <ShoppingBag className="h-5 w-5" /> },
  { href: '/chat', label: 'Chat', icon: <MessageCircle className="h-5 w-5" /> },
  { href: '/training', label: 'Training', icon: <BookOpen className="h-5 w-5" /> },
];

const designerNavItems: NavItem[] = [
  { href: '/designer/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { href: '/designer/appointments', label: 'Appointments', icon: <ClipboardList className="h-5 w-5" /> },
  { href: '/designer/portfolio', label: 'Portfolio', icon: <Grid className="h-5 w-5" /> },
  { href: '/designer/marketers', label: 'Marketers', icon: <Users className="h-5 w-5" /> },
  { href: '/designer/training', label: 'Training', icon: <BookOpen className="h-5 w-5" /> },
  { href: '/designer/planner', label: 'Planner', icon: <Calendar className="h-5 w-5" /> },
  { href: '/designer/collaborations', label: 'Collaborations', icon: <Briefcase className="h-5 w-5" /> },
];

const vendorNavItems: NavItem[] = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { href: '/vendor/catalog', label: 'Catalog', icon: <Package className="h-5 w-5" /> },
  { href: '/vendor/orders', label: 'Orders', icon: <ClipboardList className="h-5 w-5" /> },
];

const marketerNavItems: NavItem[] = [
  { href: '/marketer/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { href: '/marketer/portfolio', label: 'Portfolio', icon: <Grid className="h-5 w-5" /> },
  { href: '/marketer/bookings', label: 'Bookings', icon: <Calendar className="h-5 w-5" /> },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  const navItems = {
    Client: clientNavItems,
    Designer: designerNavItems,
    Vendor: vendorNavItems,
    Marketer: marketerNavItems,
  }[user?.role || 'Client'] || clientNavItems;

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-surface border-r border-border transition-transform duration-300',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2" aria-label={`${APP_NAME} home`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-primary">{APP_NAME}</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-textPrimary truncate">{user.fullName}</p>
              <p className="text-xs text-textSecondary">{user.role}</p>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Navigation menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-primary text-white'
                  : 'text-textSecondary hover:bg-muted hover:text-primary'
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-textSecondary hover:text-error hover:bg-error/10"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
