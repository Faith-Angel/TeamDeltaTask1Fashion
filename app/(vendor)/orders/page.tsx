'use client';

import { useState } from 'react';
import { ClipboardList, Package, Truck, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi, ordersApi } from '@/services/apiClient';
import { QUERY_KEYS, DELIVERY_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatXAF, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types/models';

const DELIVERY_STYLES: Record<Order['deliveryStatus'], string> = {
  Pending: 'bg-warning/10 text-warning border-warning/20',
  'In Transit': 'bg-primary/10 text-primary border-primary/20',
  Delivered: 'bg-success/10 text-success border-success/20',
};

const DELIVERY_ICONS: Record<Order['deliveryStatus'], React.ReactNode> = {
  Pending: <Package className="w-4 h-4" aria-hidden="true" />,
  'In Transit': <Truck className="w-4 h-4" aria-hidden="true" />,
  Delivered: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
};

const NEXT_STATUS: Partial<Record<Order['deliveryStatus'], Order['deliveryStatus']>> = {
  Pending: 'In Transit',
  'In Transit': 'Delivered',
};

const NEXT_LABEL: Partial<Record<Order['deliveryStatus'], string>> = {
  Pending: 'Mark In Transit',
  'In Transit': 'Mark Delivered',
};

export default function VendorOrdersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Order['deliveryStatus'] | 'All'>('All');

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ORDERS, 'vendor'],
    queryFn: () => vendorApi.getVendorOrders().then((r) => r.data),
  });

  const { mutate: updateDelivery, isPending: updating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateDeliveryStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS, 'vendor'] }),
  });

  const orders: Order[] = data?.items ?? [];

  const filtered = orders.filter(
    (o) => filter === 'All' || o.deliveryStatus === filter
  );

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.deliveryStatus] = (acc[o.deliveryStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Orders</h1>
        <p className="text-textSecondary text-sm mt-1">Track and fulfill customer orders</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DELIVERY_STATUSES.map((s) => (
          <div key={s} className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-xl font-bold text-primary">{counts[s] || 0}</p>
            <p className="text-xs text-textSecondary">{s}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6" role="tablist" aria-label="Filter orders by delivery status">
        {(['All', ...DELIVERY_STATUSES] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px]',
              filter === f
                ? 'bg-primary text-white'
                : 'bg-muted text-textSecondary hover:bg-primary/10 hover:text-primary'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-36 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">Customer orders will appear here once they purchase from your catalog</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ol className="space-y-4" aria-label="Orders list">
          {filtered.map((order) => {
            const nextStatus = NEXT_STATUS[order.deliveryStatus];
            return (
              <li
                key={order.id}
                className="bg-surface rounded-xl border border-border p-5"
                aria-label={`Order ${order.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-textPrimary text-sm">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'text-xs border flex-shrink-0 flex items-center gap-1',
                      DELIVERY_STYLES[order.deliveryStatus]
                    )}
                  >
                    {DELIVERY_ICONS[order.deliveryStatus]}
                    {order.deliveryStatus}
                  </Badge>
                </div>

                {/* Items */}
                <ul className="space-y-1 mb-3" aria-label="Order items">
                  {order.items?.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-textSecondary">
                        {item.name} ×{item.quantity}
                      </span>
                      <span className="text-textPrimary font-medium">
                        {formatXAF(item.unitPrice * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-textSecondary">
                      Payment:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          order.paymentStatus === 'Paid' ? 'text-success' : 'text-warning'
                        )}
                      >
                        {order.paymentStatus}
                      </span>
                    </p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      Total: {formatXAF(order.total)}
                    </p>
                  </div>

                  {nextStatus && (
                    <Button
                      size="sm"
                      className="bg-primary text-white text-xs"
                      disabled={updating}
                      onClick={() => updateDelivery({ id: order.id, status: nextStatus })}
                      aria-label={`${NEXT_LABEL[order.deliveryStatus]} for order ${order.id}`}
                    >
                      {NEXT_LABEL[order.deliveryStatus]}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
