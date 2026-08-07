'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'USER' | 'BARBER' | 'ADMIN' | 'OWNER'>;
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // If not authenticated or role is not in allowedRoles, redirect to login page
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && !allowedRoles.includes(user.role)) {
      // Redirect authenticated users to their correct dashboards based on role
      if (user.role === 'USER') router.push('/dashboard');
      else if (user.role === 'BARBER') router.push('/schedule');
      else if (user.role === 'ADMIN') router.push('/admin/triage');
      else if (user.role === 'OWNER') router.push('/owner/bi');
      else router.push('/login');
    } else {
      setHasAccess(true);
    }
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!hasAccess) {
    // Render loading state while checking access permissions
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="font-sans text-sm text-text-muted">Ruxsat tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
