export type ItemStatus = 'ok' | 'low' | 'out';

export interface BatchSummary {
  id: string;
  quantity: number;
  expiry_date: string | null;
}

export interface Item {
  id: string;
  orgId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unit: string;
  price: number | null;
  minStock: number;
  totalStock: number;
  earliestExpiry: string | null;
  batches: BatchSummary[];
  status?: ItemStatus;
  createdAt: string;
  updatedAt: string;
}
