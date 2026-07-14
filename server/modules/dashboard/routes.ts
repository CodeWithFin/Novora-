import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import { getStockStatus } from '../../../shared/utils/stock.js';

/**
 * Dashboard summary uses light aggregates (not items_with_stock), because that
 * view JSON-aggregates every batch and is costly for COUNT/SUM cards.
 */
export async function getDashboardSummary(sql: Sql, orgId: string) {
  const [
    itemStatsRows,
    expiryStatsRows,
    recentTransactions,
    lowStockItems,
    topItems,
    movement,
  ] = await Promise.all([
    sql<
      {
        total_items: number;
        total_stock: number;
        total_value: number;
        low_stock: number;
        out_of_stock: number;
        category_count: number;
        ok_stock: number;
      }[]
    >`
      SELECT
        COUNT(*)::int AS total_items,
        COALESCE(SUM(s.total_stock), 0)::int AS total_stock,
        COALESCE(SUM(i.price * s.total_stock), 0)::numeric AS total_value,
        COUNT(*) FILTER (
          WHERE s.total_stock > 0 AND s.total_stock <= i.min_stock
        )::int AS low_stock,
        COUNT(*) FILTER (WHERE s.total_stock = 0)::int AS out_of_stock,
        COUNT(DISTINCT i.category)::int AS category_count,
        COUNT(*) FILTER (
          WHERE s.total_stock > i.min_stock
        )::int AS ok_stock
      FROM items i
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(b.quantity), 0)::int AS total_stock
        FROM item_batches b
        WHERE b.item_id = i.id AND b.quantity > 0
      ) s ON true
      WHERE i.org_id = ${orgId}
    `,
    sql<{ expiring_7: number; expiring_30: number }[]>`
      SELECT
        COUNT(*) FILTER (
          WHERE expiry_date <= CURRENT_DATE + 7
        )::int AS expiring_7,
        COUNT(*) FILTER (
          WHERE expiry_date <= CURRENT_DATE + 30
        )::int AS expiring_30
      FROM item_batches
      WHERE org_id = ${orgId}
        AND quantity > 0
        AND expiry_date IS NOT NULL
        AND expiry_date > CURRENT_DATE
    `,
    sql<
      {
        id: string;
        type: string;
        quantity: number;
        item_name: string;
        shop_name: string | null;
        created_at: Date;
      }[]
    >`
      SELECT t.id, t.type, t.quantity, i.name AS item_name,
             s.name AS shop_name, t.created_at
      FROM transactions t
      JOIN items i ON i.id = t.item_id
      LEFT JOIN shops s ON s.id = t.shop_id
      WHERE t.org_id = ${orgId}
      ORDER BY t.created_at DESC
      LIMIT 10
    `,
    sql<
      {
        id: string;
        name: string;
        total_stock: number;
        min_stock: number;
      }[]
    >`
      SELECT i.id, i.name, s.total_stock, i.min_stock
      FROM items i
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(b.quantity), 0)::int AS total_stock
        FROM item_batches b
        WHERE b.item_id = i.id AND b.quantity > 0
      ) s ON true
      WHERE i.org_id = ${orgId}
        AND s.total_stock <= i.min_stock
      ORDER BY s.total_stock ASC
      LIMIT 10
    `,
    sql<{ id: string; name: string; total_stock: number }[]>`
      SELECT i.id, i.name, s.total_stock
      FROM items i
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(b.quantity), 0)::int AS total_stock
        FROM item_batches b
        WHERE b.item_id = i.id AND b.quantity > 0
      ) s ON true
      WHERE i.org_id = ${orgId}
      ORDER BY s.total_stock DESC
      LIMIT 5
    `,
    sql<{ date: string; type: string; total: number }[]>`
      SELECT transaction_date::text AS date, type,
             SUM(quantity)::int AS total
      FROM transactions
      WHERE org_id = ${orgId}
        AND transaction_date >= CURRENT_DATE - 30
      GROUP BY transaction_date, type
      ORDER BY transaction_date ASC
    `,
  ]);

  const itemStats = itemStatsRows[0] ?? {
    total_items: 0,
    total_stock: 0,
    total_value: 0,
    low_stock: 0,
    out_of_stock: 0,
    category_count: 0,
    ok_stock: 0,
  };
  const expiryStats = expiryStatsRows[0] ?? {
    expiring_7: 0,
    expiring_30: 0,
  };

  const totalItems = itemStats.total_items;
  const inventoryHealth =
    totalItems > 0
      ? Math.round((itemStats.ok_stock / totalItems) * 100)
      : 100;

  return {
    totalItems,
    totalStock: itemStats.total_stock,
    totalValue: Number(itemStats.total_value),
    lowStockCount: itemStats.low_stock,
    outOfStockCount: itemStats.out_of_stock,
    categoryCount: itemStats.category_count,
    expiringIn7Days: expiryStats.expiring_7,
    expiringIn30Days: expiryStats.expiring_30,
    inventoryHealth,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      quantity: t.quantity,
      itemName: t.item_name,
      shopName: t.shop_name,
      createdAt: t.created_at.toISOString(),
    })),
    lowStockItems: lowStockItems.map((i) => ({
      id: i.id,
      name: i.name,
      totalStock: i.total_stock,
      minStock: i.min_stock,
      status: getStockStatus(i.total_stock, i.min_stock),
    })),
    topItems: topItems.map((i) => ({
      id: i.id,
      name: i.name,
      totalStock: i.total_stock,
    })),
    stockMovement: movement.map((m) => ({
      date: m.date,
      type: m.type,
      total: m.total,
    })),
  };
}

export function registerDashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/dashboard/summary',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const data = await getDashboardSummary(
        fastify.db,
        request.authOrg.id
      );
      return reply.send({ success: true, data });
    }
  );
}
