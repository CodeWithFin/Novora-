'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import * as shopsApi from '@/lib/api/shops';

export function useShops() {
  return useQuery({
    queryKey: ['shops'],
    queryFn: () => shopsApi.getShops(),
  });
}

export function useCreateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shopsApi.createShop,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof shopsApi.updateShop>[1];
    }) => shopsApi.updateShop(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });
}

export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shopsApi.deleteShop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });
}
