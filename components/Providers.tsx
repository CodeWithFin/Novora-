'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthHydration } from '@/components/AuthHydration';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydration>{children}</AuthHydration>
      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: 'var(--bg-overlay)',
            border: '2px solid var(--border-strong)',
            color: 'var(--text-primary)',
            boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
