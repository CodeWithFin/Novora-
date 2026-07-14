import api, { getData } from './client';
import type { Shop } from '@/shared/types/shop';

export async function getShops() {
  return getData<Shop[]>(await api.get('/shops'));
}

export async function createShop(data: {
  name: string;
  location?: string;
}) {
  return getData<Shop>(await api.post('/shops', data));
}

export async function updateShop(
  id: string,
  data: Partial<{ name: string; location: string; isActive: boolean }>
) {
  return getData<Shop>(await api.patch(`/shops/${id}`, data));
}

export async function deleteShop(id: string) {
  return getData<{ deleted: boolean }>(
    await api.delete(`/shops/${id}`)
  );
}
