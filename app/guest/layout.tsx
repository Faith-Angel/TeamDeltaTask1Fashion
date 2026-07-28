export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Guest top bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border h-14 flex items-center px-4 gap-3">
        <div className="flex items-center gap-2 font-bold text-primary text-lg">
          <NeedleThreadLogo className="w-6 h-6" />
          <span>ndolostitch</span>
        </div>
        <div className="flex-1" />
        <a
          href="/login"
          className="text-sm font-medium text-primary hover:underline px-3 py-2 min-h-[44px] flex items-center"
        >
          Sign In
        </a>
        <a
          href="/register"
          className="text-sm font-medium bg-primary text-white rounded-lg px-3 py-2 min-h-[44px] flex items-center hover:bg-primary-dark transition-colors"
        >
          Join Free
        </a>
      </header>
      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}

function NeedleThreadLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C10.5 2 9 3.5 9 5C9 6.5 10 7.5 11 8L5 19C4.5 20 5 21 6 21C7 21 7.5 20.5 8 19.5L14 8C15 7.5 15 6 15 5C15 3.5 13.5 2 12 2Z" fill="currentColor" opacity="0.9"/>
      <path d="M11 5.5C11 5.2 11.2 5 11.5 5H12.5C12.8 5 13 5.2 13 5.5C13 5.8 12.8 6 12.5 6H11.5C11.2 6 11 5.8 11 5.5Z" fill="white"/>
      <path d="M16 3C16 3 19 5 20 8C21 11 19 14 17 15" stroke="#F9A825" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
