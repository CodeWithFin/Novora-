'use client';

import { useAuthStore } from '@/lib/store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const org = useAuthStore((s) => s.org);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isStaff = useAuthStore((s) => s.isStaff);
  const isViewer = useAuthStore((s) => s.isViewer);

  return {
    user,
    org,
    token,
    isLoading,
    hydrated,
    setAuth,
    clearAuth,
    isAdmin: isAdmin(),
    isStaff: isStaff(),
    isViewer: isViewer(),
  };
}
