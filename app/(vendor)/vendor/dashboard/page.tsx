'use client';

import Link from 'next/link';
import { Package, ClipboardList, TrendingUp, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { vendorApi, ordersApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import { formatXAF } from '@/lib/utils';

const quickLinks = [
  {
    href: '/vendor/catalog',
    icon: <Package className="w-6 h-6" />,
    label: 'Catalog',
    description: 'Manage your product listings',
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/vendor/orders',
    icon: <ClipboardList className="w-6 h-6" />,
    label: 'Orders',
    description: 'Track and fulfill orders',
    color: 'bg-accent/10 text-accent',
  },
];

export default function VendorDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: listingsData } = useQuery({
    queryKey: [QUERY_KEYS.MARKETPLACE, 'vendor'],
    queryFn: () => vendorApi.getVendorListings().then((r) => r.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: [QUERY_KEYS.ORDERS, 'vendor'],
    queryFn: () => vendorApi.getVendorOrders().then((r) => r.data),
  });

  const listings = listingsData?.items ?? [];
  const orders = ordersData?.items ?? [];
  const inStockCount = listings.filter((l: { inStock: boolean }) => l.inStock).length;
  const pendingOrders = orders.filter((o: { deliveryStatus: string }) => o.deliveryStatus === 'Pending').length;
  const totalRevenue = orders
    .filter((o: { paymentStatus: string }) => o.paymentStatus === 'Paid')
    .reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">
          Welcome, {user?.fullName?.split(' ')[0] || 'Vendor'} 🛍️
        </h1>
        <p className="text-textSecondary mt-1">Manage your fashion store</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-border p-4 text-center" aria-label="Active listings">
          <p className="text-2xl font-bold text-primary">{listings.length}</p>
          <p className="text-xs text-textSecondary mt-0.5">Total Listings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center" aria-label="Pending orders">
          <p className="text-2xl font-bold text-primary">{pendingOrders}</p>
          <p className="text-xs text-textSecondary mt-0.5">Pending Orders</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center" aria-label="Total revenue">
          <p className="text-lg font-bold text-primary">{formatXAF(totalRevenue)}</p>
          <p className="text-xs text-textSecondary mt-0.5">Revenue (Paid)</p>
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

      {/* Low stock warning */}
      {listings.length > 0 && inStockCount < listings.length && (
        <div
          className="mt-6 bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3"
          role="alert"
        >
          <ShoppingBag className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-warning">
              {listings.length - inStockCount} listing{listings.length - inStockCount !== 1 ? 's' : ''} out of stock
            </p>
            <p className="text-xs text-textSecondary mt-0.5">
              Visit your catalog to update stock status.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
