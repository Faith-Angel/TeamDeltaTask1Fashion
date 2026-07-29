'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { formatXAF } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, deliveryFee, total, isEmpty } = useCart();

  if (isEmpty) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <ShoppingBag className="w-16 h-16 text-border mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-bold text-textPrimary mb-2">Your cart is empty</h1>
        <p className="text-textSecondary text-sm mb-6">Discover fashion items in our marketplace</p>
        <Button asChild className="bg-primary text-white">
          <Link href="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-textPrimary mb-6">Shopping Cart</h1>

      <div className="space-y-4 mb-8">
        {items.map(({ listing, quantity }) => {
          const image = listing.images[0]?.url;
          return (
            <div
              key={listing.id}
              className="bg-surface rounded-xl border border-border p-4 flex gap-4 items-center"
              role="group"
              aria-label={listing.name}
            >
              {/* Image */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {image ? (
                  <Image src={image} alt={listing.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="h-full bg-muted" aria-hidden="true" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-textPrimary text-sm truncate">{listing.name}</p>
                <p className="text-xs text-textSecondary capitalize">{listing.category.replace(/_/g, ' ')}</p>
                <p className="text-primary font-bold text-sm mt-0.5">{formatXAF(listing.price)}</p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${listing.name}`}>
                <button
                  onClick={() => updateQuantity(listing.id, quantity - 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors min-h-[44px] min-w-[44px]"
                  aria-label={`Decrease quantity of ${listing.name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => updateQuantity(listing.id, quantity + 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors min-h-[44px] min-w-[44px]"
                  aria-label={`Increase quantity of ${listing.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line total */}
              <p className="text-sm font-semibold text-textPrimary w-24 text-right hidden sm:block">
                {formatXAF(listing.price * quantity)}
              </p>

              {/* Remove */}
              <button
                onClick={() => removeItem(listing.id)}
                className="text-error hover:text-error/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Remove ${listing.name} from cart`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-surface rounded-xl border border-border p-5" aria-label="Order summary">
        <h2 className="font-semibold text-textPrimary mb-4">Order Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-textSecondary">Subtotal</dt>
            <dd className="text-textPrimary font-medium">{formatXAF(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-textSecondary">Delivery fee</dt>
            <dd className="text-textPrimary font-medium">{formatXAF(deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-2">
            <dt className="font-semibold text-textPrimary">Total</dt>
            <dd className="font-bold text-primary text-base">{formatXAF(total)}</dd>
          </div>
        </dl>

        <Button asChild className="w-full bg-primary text-white mt-5">
          <Link href="/checkout" aria-label="Proceed to checkout">Proceed to Checkout</Link>
        </Button>
        <Button asChild variant="outline" className="w-full mt-2">
          <Link href="/marketplace">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
