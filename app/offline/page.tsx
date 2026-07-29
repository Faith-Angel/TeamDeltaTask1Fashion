export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🌿</div>
        <h1 className="text-2xl font-bold text-textPrimary mb-3">You&apos;re offline</h1>
        <p className="text-textSecondary mb-6">
          ndolostitch needs an internet connection. Please check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors min-h-[44px]"
          aria-label="Retry connection"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
