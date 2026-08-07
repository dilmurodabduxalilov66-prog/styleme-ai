'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().hydrateAuth();
  }, []);

  // Ensure query client is instantiated lazily per-user session on Client Side Rendering
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60 * 1000, // 1 minute default stale time
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
