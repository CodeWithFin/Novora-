import api, { getData } from './client';
import type { Transaction } from '@/shared/types/transaction';
import type { PaginationMeta } from '@/shared/types/api';

export async function getTransactions(
  params?: Record<string, string | number>
) {
  const res = await api.get('/transactions', { params });
  return {
    data: res.data.data as Transaction[],
    meta: res.data.meta as PaginationMeta,
  };
}

export async function undoTransaction(id: string) {
  return getData<{ undone: boolean }>(
    await api.delete(`/transactions/${id}`)
  );
}
