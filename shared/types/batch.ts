export interface Batch {
  id: string;
  itemId: string;
  quantity: number;
  expiryDate: string | null;
  itemName?: string;
  itemSku?: string | null;
  itemUnit?: string;
  daysRemaining?: number;
}
