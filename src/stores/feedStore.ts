import { create } from 'zustand';

interface FeedStore {
  lastScrollPosition: number;
  setScrollPosition: (pos: number) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedStore>((set) => ({
  lastScrollPosition: 0,
  setScrollPosition: (pos) => set({ lastScrollPosition: pos }),
  reset: () => set({ lastScrollPosition: 0 }),
}));
