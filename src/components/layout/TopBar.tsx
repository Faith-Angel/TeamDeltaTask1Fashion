'use client';

import Link from 'next/link';
import { Bell, ShoppingCart, Menu } from 'lucide-react';
import { NdoloLogo } from '@/components/ui/NdoloLogo';
import { useCartStore } from '@/stores/cartStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  onMenuClick?: () => void;
  showCart?: boolean;
  role?: string;
}

export default function TopBar({ onMenuClick, showCart = false, role }: TopBarProps) {
  const itemCount = useCartStore((s) => s.itemCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border h-14 flex items-center px-4 gap-3">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted text-textSecondary min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <Link
        href={role === 'Designer' ? '/designer/dashboard' : role === 'Vendor' ? '/vendor/dashboard' : role === 'Marketer' ? '/marketer/dashboard' : '/dashboard'}
        className="min-h-[44px] flex items-center"
        aria-label="ndolostitch home"
      >
        <NdoloLogo size="sm" />
      </Link>

      <div className="flex-1" />

      {/* Actions */}
      <nav className="flex items-center gap-1" aria-label="Quick actions">
        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-muted text-textSecondary min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-accent text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold text-textPrimary" aria-hidden="true">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Cart (client only) */}
        {showCart && (
          <Link
            href="/cart"
            className="relative p-2 rounded-lg hover:bg-muted text-textSecondary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} item(s)` : ''}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>
        )}
      </nav>
    </header>
  );
}
