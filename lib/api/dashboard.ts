import api, { getData } from './client';

export interface DashboardSummary {
  totalItems: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCount: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  inventoryHealth: number;
  recentTransactions: {
    id: string;
    type: string;
    quantity: number;
    itemName: string;
    shopName: string | null;
    createdAt: string;
  }[];
  lowStockItems: {
    id: string;
    name: string;
    totalStock: number;
    minStock: number;
    status: string;
  }[];
  topItems: { id: string; name: string; totalStock: number }[];
  stockMovement: { date: string; type: string; total: number }[];
}

export async function getDashboardSummary() {
  return getData<DashboardSummary>(
    await api.get('/dashboard/summary')
  );
}
