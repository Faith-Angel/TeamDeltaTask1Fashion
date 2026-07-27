'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, X, Send, MapPin } from 'lucide-react';
import { useFeed, useOutfitGenerator } from '@/hooks/useFeed';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';
import type { FeedItem } from '@/types/models';

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <article
      className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
      aria-label={item.title || 'Fashion inspiration'}
    >
      <div className="relative aspect-[4/5] w-full bg-muted">
        <Image
          src={item.imageUrl}
          alt={item.title || 'Fashion inspiration'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>
      <div className="p-3">
        {item.title && (
          <p className="text-sm font-semibold text-textPrimary truncate">{item.title}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Style tags">
          {item.styleTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-primary/10 text-primary border-0" role="listitem">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-textSecondary mt-1">{timeAgo(item.createdAt)}</p>
      </div>
    </article>
  );
}

function AIOutfitModal({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  const { mutate: generate, isPending, data, reset } = useOutfitGenerator();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI Outfit Generator"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-textPrimary">AI Outfit Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-textSecondary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close AI outfit generator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-textSecondary">
            Describe the outfit style you want and let AI suggest a concept for Cameroonian fashion designers.
          </p>

          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Kente-inspired evening gown with modern cuts..."
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              aria-label="Outfit prompt"
              className="flex-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={isPending || !prompt.trim()}
              className="bg-primary text-white"
              aria-label="Generate outfit"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {isPending && (
            <div className="flex items-center justify-center py-6" role="status" aria-live="polite">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
              <span className="ml-2 text-sm text-textSecondary">Generating concept...</span>
            </div>
          )}

          {data && !isPending && (
            <div className="rounded-xl border border-border overflow-hidden" role="region" aria-label="Generated outfit concept">
              {data.imageUrl && (
                <div className="relative aspect-[4/5] w-full bg-muted">
                  <Image
                    src={data.imageUrl}
                    alt="AI generated outfit concept"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              )}
              <div className="p-4 bg-primary/5">
                <p className="text-sm text-textPrimary font-medium">Concept</p>
                <p className="text-sm text-textSecondary mt-1">{data.concept}</p>
                <Button
                  variant="outline"
                  className="mt-3 w-full text-sm"
                  onClick={() => { reset(); setPrompt(''); }}
                >
                  Try another prompt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed();
  const [showAI, setShowAI] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Inspiration Feed</h1>
          <p className="text-textSecondary text-sm mt-1">Discover Cameroonian fashion styles</p>
        </div>
        <Button
          onClick={() => setShowAI(true)}
          className="bg-primary text-white gap-2 hidden sm:flex"
          aria-label="Open AI outfit generator"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          AI Generate
        </Button>
        <Button
          onClick={() => setShowAI(true)}
          className="bg-primary text-white sm:hidden p-2"
          aria-label="Open AI outfit generator"
        >
          <Sparkles className="w-5 h-5" />
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading feed">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-[4/5] animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Feed grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allItems.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="flex justify-center py-6" aria-live="polite">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-textSecondary text-sm" role="status">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
            Loading more...
          </div>
        )}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-textSecondary text-sm">You&apos;ve seen all inspirations</p>
        )}
      </div>

      {showAI && <AIOutfitModal onClose={() => setShowAI(false)} />}
    </div>
  );
}
