'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { feedApi } from '@/services/apiClient';
import { Sparkles } from 'lucide-react';

export default function GuestFeedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['guest-feed'],
    queryFn: () => feedApi.getFeed().then((r) => r.data),
  });

  const items = (data?.items ?? []) as Array<{
    id: string;
    imageUrl: string;
    title?: string;
    styleTags: string[];
  }>;

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-primary/10 border border-primary/20 p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary mb-4">
          <Sparkles className="w-7 h-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
          Cameroon Fashion Inspiration
        </h1>
        <p className="text-textSecondary mb-5 max-w-md mx-auto">
          Discover stunning traditional and contemporary Cameroonian fashion. Join to connect with designers.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors min-h-[44px] flex items-center"
          >
            Join NdoloStitch Free
          </Link>
          <Link
            href="/login"
            className="border border-primary text-primary px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/10 transition-colors min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Browse sections">
        <Link
          href="/guest/feed"
          role="tab"
          aria-selected="true"
          className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-white min-h-[44px] flex items-center"
        >
          Inspiration Feed
        </Link>
        <Link
          href="/guest/marketplace"
          role="tab"
          aria-selected="false"
          className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors min-h-[44px] flex items-center"
        >
          Marketplace
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading feed">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-[3/4] animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Feed grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted group cursor-pointer"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title || 'Fashion inspiration'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                {item.styleTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-accent/90 text-textPrimary text-xs px-2 py-0.5 rounded-full mr-1 mb-1 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/register"
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40"
                aria-label="Join to connect with this designer"
              >
                <span className="bg-white text-primary font-semibold text-sm px-4 py-2 rounded-xl shadow-md">
                  Join to Book Designer
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <p className="font-medium">No feed items yet</p>
          <p className="text-sm mt-1">Check back soon for Cameroonian fashion inspiration</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 text-center py-8 border-t border-border">
        <p className="text-textSecondary mb-4 font-medium">Ready to connect with Cameroonian designers?</p>
        <Link
          href="/register"
          className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors inline-flex items-center min-h-[44px] text-base"
        >
          Create Your Free Account
        </Link>
      </div>
    </div>
  );
}
