import api, { getData } from './client';
import type { Item } from '@/shared/types/item';
import type { PaginationMeta } from '@/shared/types/api';

export async function getItems(params?: Record<string, string | number | undefined>) {
  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      )
    : undefined;
  const res = await api.get('/items', { params: cleanParams });
  return {
    data: res.data.data as Item[],
    meta: res.data.meta as PaginationMeta,
  };
}

export async function getItem(id: string) {
  return getData<Item>(await api.get(`/items/${id}`));
}

export async function createItem(data: Partial<Item>) {
  return getData<Item>(await api.post('/items', data));
}

export type BatchCreateItemInput = Partial<Item> & {
  quantity?: number | null;
  expiryDate?: string | null;
};

export async function batchCreateItems(items: BatchCreateItemInput[]) {
  return getData<{ created: number; skipped: number; stocked: number }>(
    await api.post('/items/batch', { items }, { timeout: 120_000 })
  );
}

export async function updateItem(id: string, data: Partial<Item>) {
  return getData<Item>(await api.patch(`/items/${id}`, data));
}

export async function deleteItem(id: string) {
  return getData<{ deleted: boolean }>(
    await api.delete(`/items/${id}`)
  );
}

