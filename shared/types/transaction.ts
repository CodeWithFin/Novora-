export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  orgId: string;
  itemId: string;
  itemName: string;
  itemSku: string | null;
  itemUnit: string;
  type: TransactionType;
  quantity: number;
  shopId: string | null;
  shopName: string | null;
  notes: string | null;
  transactionDate: string;
  createdByName: string | null;
  createdAt: string;
}
