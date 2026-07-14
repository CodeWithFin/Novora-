export type StockStatus = 'ok' | 'low' | 'out';

export const getStockStatus = (
  stock: number,
  minStock: number
): StockStatus => {
  if (stock === 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
};

export const getExpiryUrgency = (
  daysRemaining: number
): 'critical' | 'warning' | 'soon' | 'ok' => {
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  if (daysRemaining <= 90) return 'soon';
  return 'ok';
};
