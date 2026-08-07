'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import RoleGuard from '@/components/auth/RoleGuard';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['USER']}>
      <div className="min-h-screen flex flex-col bg-canvas text-text-primary">
        {/* Sticky Desktop Navbar */}
        <Navbar />

        {/* Core Layout Main Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
          {children}
        </main>

        {/* Sticky Mobile Bottom Navigation Dock */}
        <MobileNav />
      </div>
    </RoleGuard>
  );
}
