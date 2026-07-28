import Link from 'next/link';
import { NdoloLogo } from '@/components/ui/NdoloLogo';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Guest top bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border h-14 flex items-center px-4 gap-3">
        <Link
          href="/guest/feed"
          className="flex items-center min-h-[44px]"
          aria-label="NdoloStitch home"
        >
          <NdoloLogo size="sm" />
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1 ml-2" aria-label="Guest navigation">
          <Link
            href="/guest/feed"
            className="text-sm text-textSecondary hover:text-primary px-3 py-2 rounded-md hover:bg-muted transition-colors min-h-[44px] flex items-center"
          >
            Feed
          </Link>
          <Link
            href="/guest/marketplace"
            className="text-sm text-textSecondary hover:text-primary px-3 py-2 rounded-md hover:bg-muted transition-colors min-h-[44px] flex items-center"
          >
            Marketplace
          </Link>
        </nav>

        <div className="flex-1" />

        <nav className="flex items-center gap-2" aria-label="Auth actions">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline px-3 py-2 min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-primary text-white rounded-lg px-4 py-2 min-h-[44px] flex items-center hover:bg-primary-dark transition-colors"
          >
            Join Free
          </Link>
        </nav>
      </header>

      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}
