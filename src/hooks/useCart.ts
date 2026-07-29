'use client';

import { useCartStore } from '@/stores/cartStore';
import type { Listing } from '@/types/models';

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clear, total, itemCount } = useCartStore();

  const handleAddItem = (listing: Listing) => {
    if (!listing.inStock) {
      throw new Error('Item unavailable');
    }
    addItem(listing);
  };

  const subtotal = items.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 2500 : 0; // Flat 2500 XAF delivery
  const totalWithDelivery = subtotal + deliveryFee;

  return {
    items,
    addItem: handleAddItem,
    removeItem,
    updateQuantity,
    clear,
    total: totalWithDelivery,
    subtotal,
    deliveryFee,
    itemCount: items.length,
    isEmpty: items.length === 0,
  };
}
