'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import * as stockApi from '@/lib/api/stock';

export function useExpiringBatches(days = 30, search?: string) {
  return useQuery({
    queryKey: ['stock', 'expiring', days, search],
    queryFn: () => stockApi.getExpiring(days, search),
  });
}

export function useStockOutPreview(itemId: string, quantity: number) {
  return useQuery({
    queryKey: ['stock', 'preview', itemId, quantity],
    queryFn: () => stockApi.previewStockOut(itemId, quantity),
    enabled: !!itemId && quantity > 0,
    staleTime: 30_000,
  });
}

export function useStockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.stockIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useStockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.stockOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}
