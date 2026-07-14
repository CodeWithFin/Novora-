import api, { getData } from './client';

export async function stockIn(data: {
  items: {
    itemId: string;
    quantity: number;
    expiryDate?: string;
    notes?: string;
  }[];
  transactionDate?: string;
  globalNotes?: string;
}) {
  return getData<{ transactions: unknown[] }>(
    await api.post('/stock/in', data)
  );
}

export async function stockOut(data: {
  items: { itemId: string; quantity: number; notes?: string }[];
  shopId: string;
  transactionDate?: string;
  globalNotes?: string;
}) {
  return getData<{ transactions: unknown[] }>(
    await api.post('/stock/out', data)
  );
}

export async function previewStockOut(itemId: string, quantity: number) {
  return getData<{
    itemId: string;
    itemName: string;
    totalAvailable: number;
    sufficient: boolean;
    batches: {
      batchId: string;
      expiryDate: string | null;
      available: number;
      willDeduct: number;
    }[];
  }>(await api.get('/stock/out/preview', { params: { itemId, quantity } }));
}

export async function getExpiring(days = 365, search?: string) {
  return getData<
    {
      id: string;
      itemId: string;
      quantity: number;
      expiryDate: string;
      itemName: string;
      itemSku: string | null;
      itemUnit: string;
      daysRemaining: number;
    }[]
  >(
    await api.get('/stock/expiring', {
      params: { days, search },
    })
  );
}
