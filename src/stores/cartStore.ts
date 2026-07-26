import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Listing } from '@/types/models';

interface CartStore {
  items: CartItem[];
  addItem: (listing: Listing) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  itemCount: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (listing) => {
        if (!listing.inStock) {
          throw new Error('Item unavailable');
        }
        set((state) => {
          const existing = state.items.find((i) => i.listing.id === listing.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.listing.id === listing.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { listing, quantity: 1 }] };
        });
      },

      removeItem: (listingId) => {
        set((state) => ({
          items: state.items.filter((i) => i.listing.id !== listingId),
        }));
      },

      updateQuantity: (listingId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(listingId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.listing.id === listingId ? { ...i, quantity } : i
          ),
        }));
      },

      clear: () => set({ items: [] }),

      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.listing.price * item.quantity,
          0
        );
      },

      get itemCount() {
        return get().items.length;
      },
    }),
    {
      name: 'ndolostitch-cart',
    }
  )
);
