'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '@/stores/authStore';

interface PageShellProps {
  children: React.ReactNode;
  showCart?: boolean;
}

export default function PageShell({ children, showCart = false }: PageShellProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar showCart={showCart} role={user?.role} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
