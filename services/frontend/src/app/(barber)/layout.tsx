'use client';

import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import Sidebar from '@/components/layout/Sidebar';
import { Menu, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleSidebar } = useUIStore();
  const { clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <RoleGuard allowedRoles={['BARBER']}>
      <div className="min-h-screen flex text-text-primary bg-transparent">
        {/* Desktop Left Sidebar */}
        <Sidebar />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Header */}
          <header className="md:hidden flex h-16 items-center justify-between px-4 glass-panel sticky top-0 z-30 mb-2 mx-2 mt-2 rounded-lg">
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded text-text-muted hover:text-text-primary"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-display text-sm font-bold tracking-tight">
              StyleMe <span className="text-primary">Partner</span>
            </span>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
