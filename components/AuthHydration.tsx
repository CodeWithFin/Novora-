'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Restore auth from localStorage after mount only — never during SSR —
 * so server HTML matches the first client render.
 */
export function AuthHydration({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
