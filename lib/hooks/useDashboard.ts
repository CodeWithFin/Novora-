'use client';

import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/lib/api/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getDashboardSummary(),
    staleTime: 60_000,
    refetchOnMount: false,
  });
}
