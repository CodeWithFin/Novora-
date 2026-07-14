import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';
import {
  buildMeta,
  getPaginationOffset,
  parsePagination,
} from '../../shared/pagination.js';

function mapTransaction(row: {
  id: string;
  org_id: string;
  item_id: string;
  item_name: string;
  item_sku: string | null;
  item_unit: string;
  type: string;
  quantity: number;
  shop_id: string | null;
  shop_name: string | null;
  notes: string | null;
  transaction_date: Date;
  created_by_name: string | null;
  created_at: Date;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    itemId: row.item_id,
    itemName: row.item_name,
    itemSku: row.item_sku,
    itemUnit: row.item_unit,
    type: row.type as 'IN' | 'OUT',
    quantity: row.quantity,
    shopId: row.shop_id,
    shopName: row.shop_name,
    notes: row.notes,
    transactionDate: row.transaction_date.toISOString().slice(0, 10),
    createdByName: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listTransactions(
  sql: Sql,
  orgId: string,
  query: Record<string, string | undefined>
) {
  const pagination = parsePagination(query);
  const { limit, offset } = getPaginationOffset(pagination);
  const itemId = query.itemId;
  const type = query.type;
  const shopId = query.shopId;
  const search = query.search?.trim();

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM transactions t
    JOIN items i ON i.id = t.item_id
    WHERE t.org_id = ${orgId}
    ${itemId ? sql`AND t.item_id = ${itemId}` : sql``}
    ${type ? sql`AND t.type = ${type}` : sql``}
    ${shopId ? sql`AND t.shop_id = ${shopId}` : sql``}
    ${search ? sql`AND (i.name ILIKE ${'%' + search + '%'} OR i.sku ILIKE ${'%' + search + '%'})` : sql``}
  `;

  const rows = await sql<
    {
      id: string;
      org_id: string;
      item_id: string;
      item_name: string;
      item_sku: string | null;
      item_unit: string;
      type: string;
      quantity: number;
      shop_id: string | null;
      shop_name: string | null;
      notes: string | null;
      transaction_date: Date;
      created_by_name: string | null;
      created_at: Date;
    }[]
  >`
    SELECT t.id, t.org_id, t.item_id, i.name AS item_name,
           i.sku AS item_sku, i.unit AS item_unit, t.type,
           t.quantity, t.shop_id, s.name AS shop_name, t.notes,
           t.transaction_date, u.display_name AS created_by_name,
           t.created_at
    FROM transactions t
    JOIN items i ON i.id = t.item_id
    LEFT JOIN shops s ON s.id = t.shop_id
    LEFT JOIN users u ON u.id = t.created_by
    WHERE t.org_id = ${orgId}
    ${itemId ? sql`AND t.item_id = ${itemId}` : sql``}
    ${type ? sql`AND t.type = ${type}` : sql``}
    ${shopId ? sql`AND t.shop_id = ${shopId}` : sql``}
    ${search ? sql`AND (i.name ILIKE ${'%' + search + '%'} OR i.sku ILIKE ${'%' + search + '%'})` : sql``}
    ORDER BY t.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    data: rows.map(mapTransaction),
    meta: buildMeta(pagination, count),
  };
}

export async function undoTransaction(
  sql: Sql,
  orgId: string,
  transactionId: string
) {
  const [tx] = await sql<
    {
      id: string;
      item_id: string;
      type: string;
      quantity: number;
    }[]
  >`
    SELECT id, item_id, type, quantity FROM transactions
    WHERE id = ${transactionId} AND org_id = ${orgId}
  `;
  if (!tx) throw new NotFoundError('Transaction not found');

  await sql.begin(async (txn) => {
    if (tx.type === 'IN') {
      const [batch] = await txn<{ id: string; quantity: number }[]>`
        SELECT id, quantity FROM item_batches
        WHERE item_id = ${tx.item_id} AND org_id = ${orgId}
        ORDER BY updated_at DESC
        LIMIT 1
        FOR UPDATE
      `;

      if (batch) {
        const newQty = batch.quantity - tx.quantity;
        if (newQty <= 0) {
          await txn`DELETE FROM item_batches WHERE id = ${batch.id}`;
        } else {
          await txn`
            UPDATE item_batches SET quantity = ${newQty}, updated_at = now()
            WHERE id = ${batch.id}
          `;
        }
      }
    } else {
      const [batch] = await txn<{ id: string }[]>`
        SELECT id FROM item_batches
        WHERE item_id = ${tx.item_id} AND org_id = ${orgId}
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `;

      if (batch) {
        await txn`
          UPDATE item_batches
          SET quantity = quantity + ${tx.quantity}, updated_at = now()
          WHERE id = ${batch.id}
        `;
      } else {
        await txn`
          INSERT INTO item_batches (org_id, item_id, quantity)
          VALUES (${orgId}, ${tx.item_id}, ${tx.quantity})
        `;
      }
    }

    await txn`
      DELETE FROM transactions WHERE id = ${transactionId}
    `;
  });
}

export function registerTransactionRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/transactions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = await listTransactions(
        fastify.db,
        request.authOrg.id,
        request.query as Record<string, string>
      );
      return reply.send({ success: true, ...result });
    }
  );

  fastify.delete(
    '/api/v1/transactions/:id',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await undoTransaction(fastify.db, request.authOrg.id, id);
      return reply.send({ success: true, data: { undone: true } });
    }
  );
}
