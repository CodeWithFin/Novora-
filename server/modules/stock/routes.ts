import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { requireItemInOrg } from '../../shared/guards.js';
import {
  sendStockInEmail,
  sendStockOutEmail,
} from '../notifications/service.js';

const stockInSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.number().int().positive(),
      expiryDate: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ).min(1),
  transactionDate: z.string().optional(),
  globalNotes: z.string().optional().nullable(),
});

const stockOutSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.number().int().positive(),
      notes: z.string().optional().nullable(),
    })
  ).min(1),
  shopId: z.string().uuid(),
  transactionDate: z.string().optional(),
  globalNotes: z.string().optional().nullable(),
});

function mapTransaction(row: {
  id: string;
  org_id: string;
  item_id: string;
  type: string;
  quantity: number;
  shop_id: string | null;
  notes: string | null;
  transaction_date: Date;
  created_at: Date;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    itemId: row.item_id,
    type: row.type as 'IN' | 'OUT',
    quantity: row.quantity,
    shopId: row.shop_id,
    notes: row.notes,
    transactionDate: row.transaction_date.toISOString().slice(0, 10),
    createdAt: row.created_at.toISOString(),
  };
}

export async function stockIn(
  sql: Sql,
  orgId: string,
  userId: string,
  org: { name: string; email: string },
  body: z.infer<typeof stockInSchema>
) {
  const parsed = stockInSchema.parse(body);
  const txDate = parsed.transactionDate ?? new Date().toISOString().slice(0, 10);
  const emailItems: { name: string; quantity: number; expiryDate?: string | null }[] = [];

  const transactions = await sql.begin(async (tx) => {
    const results = [];
    for (const line of parsed.items) {
      const item = await requireItemInOrg(
        tx as unknown as Sql,
        line.itemId,
        orgId
      );
      const expiry = line.expiryDate ?? null;

      const [existingBatch] = await tx<
        { id: string; quantity: number }[]
      >`
        SELECT id, quantity FROM item_batches
        WHERE item_id = ${line.itemId}
          AND org_id = ${orgId}
          AND (
            (expiry_date IS NULL AND ${expiry}::date IS NULL)
            OR expiry_date = ${expiry}::date
          )
        FOR UPDATE
      `;

      if (existingBatch) {
        await tx`
          UPDATE item_batches
          SET quantity = quantity + ${line.quantity}, updated_at = now()
          WHERE id = ${existingBatch.id}
        `;
      } else {
        await tx`
          INSERT INTO item_batches (org_id, item_id, quantity, expiry_date)
          VALUES (${orgId}, ${line.itemId}, ${line.quantity}, ${expiry}::date)
        `;
      }

      const notes = [line.notes, parsed.globalNotes]
        .filter(Boolean)
        .join(' — ') || null;

      const [transaction] = await tx<
        {
          id: string;
          org_id: string;
          item_id: string;
          type: string;
          quantity: number;
          shop_id: string | null;
          notes: string | null;
          transaction_date: Date;
          created_at: Date;
        }[]
      >`
        INSERT INTO transactions (
          org_id, item_id, type, quantity, notes,
          transaction_date, created_by
        )
        VALUES (
          ${orgId}, ${line.itemId}, 'IN', ${line.quantity},
          ${notes}, ${txDate}::date, ${userId}
        )
        RETURNING id, org_id, item_id, type, quantity, shop_id,
                  notes, transaction_date, created_at
      `;

      emailItems.push({
        name: item.name,
        quantity: line.quantity,
        expiryDate: expiry,
      });
      results.push(mapTransaction(transaction));
    }
    return results;
  });

  sendStockInEmail(org, emailItems);
  return transactions;
}

export async function previewStockOut(
  sql: Sql,
  orgId: string,
  itemId: string,
  quantity: number
) {
  const item = await requireItemInOrg(sql, itemId, orgId);

  const batches = await sql<
    { id: string; quantity: number; expiry_date: Date | null }[]
  >`
    SELECT id, quantity, expiry_date FROM item_batches
    WHERE item_id = ${itemId} AND org_id = ${orgId} AND quantity > 0
    ORDER BY expiry_date ASC NULLS LAST
  `;

  let remaining = quantity;
  const preview = batches.map((b) => {
    const deduct = Math.min(remaining, b.quantity);
    remaining -= deduct;
    return {
      batchId: b.id,
      expiryDate: b.expiry_date
        ? b.expiry_date.toISOString().slice(0, 10)
        : null,
      available: b.quantity,
      willDeduct: deduct,
    };
  });

  const totalAvailable = batches.reduce((s, b) => s + b.quantity, 0);

  return {
    itemId,
    itemName: item.name,
    totalAvailable,
    sufficient: totalAvailable >= quantity,
    batches: preview.filter((p) => p.willDeduct > 0),
  };
}

export async function stockOut(
  sql: Sql,
  orgId: string,
  userId: string,
  org: { name: string; email: string },
  body: z.infer<typeof stockOutSchema>
) {
  const parsed = stockOutSchema.parse(body);
  const txDate = parsed.transactionDate ?? new Date().toISOString().slice(0, 10);

  const [shop] = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM shops
    WHERE id = ${parsed.shopId} AND org_id = ${orgId} AND is_active = true
  `;
  if (!shop) throw new NotFoundError('Shop not found');

  const emailItems: { name: string; quantity: number }[] = [];

  const transactions = await sql.begin(async (tx) => {
    for (const line of parsed.items) {
      const item = await requireItemInOrg(
        tx as unknown as Sql,
        line.itemId,
        orgId
      );

      const batches = await tx<
        { id: string; quantity: number; expiry_date: Date | null }[]
      >`
        SELECT id, quantity, expiry_date FROM item_batches
        WHERE item_id = ${line.itemId} AND org_id = ${orgId} AND quantity > 0
        ORDER BY expiry_date ASC NULLS LAST
        FOR UPDATE
      `;

      const available = batches.reduce((s, b) => s + b.quantity, 0);
      if (available < line.quantity) {
        throw new ValidationError(
          `Insufficient stock for ${item.name}: requested ${line.quantity}, available ${available}`
        );
      }
    }

    const results = [];
    for (const line of parsed.items) {
      const item = await requireItemInOrg(
        tx as unknown as Sql,
        line.itemId,
        orgId
      );

      const batches = await tx<
        { id: string; quantity: number }[]
      >`
        SELECT id, quantity FROM item_batches
        WHERE item_id = ${line.itemId} AND org_id = ${orgId} AND quantity > 0
        ORDER BY expiry_date ASC NULLS LAST
        FOR UPDATE
      `;

      let remaining = line.quantity;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, batch.quantity);
        remaining -= deduct;
        const newQty = batch.quantity - deduct;
        if (newQty <= 0) {
          await tx`DELETE FROM item_batches WHERE id = ${batch.id}`;
        } else {
          await tx`
            UPDATE item_batches SET quantity = ${newQty}, updated_at = now()
            WHERE id = ${batch.id}
          `;
        }
      }

      const notes = [line.notes, parsed.globalNotes]
        .filter(Boolean)
        .join(' — ') || null;

      const [transaction] = await tx<
        {
          id: string;
          org_id: string;
          item_id: string;
          type: string;
          quantity: number;
          shop_id: string | null;
          notes: string | null;
          transaction_date: Date;
          created_at: Date;
        }[]
      >`
        INSERT INTO transactions (
          org_id, item_id, type, quantity, shop_id, notes,
          transaction_date, created_by
        )
        VALUES (
          ${orgId}, ${line.itemId}, 'OUT', ${line.quantity},
          ${parsed.shopId}, ${notes}, ${txDate}::date, ${userId}
        )
        RETURNING id, org_id, item_id, type, quantity, shop_id,
                  notes, transaction_date, created_at
      `;

      emailItems.push({ name: item.name, quantity: line.quantity });
      results.push(mapTransaction(transaction));
    }
    return results;
  });

  sendStockOutEmail(org, shop, emailItems);
  return transactions;
}

export async function getExpiring(
  sql: Sql,
  orgId: string,
  days = 365,
  search?: string
) {
  const rows = await sql<
    {
      id: string;
      item_id: string;
      quantity: number;
      expiry_date: Date;
      item_name: string;
      item_sku: string | null;
      item_unit: string;
    }[]
  >`
    SELECT b.id, b.item_id, b.quantity, b.expiry_date,
           i.name AS item_name, i.sku AS item_sku, i.unit AS item_unit
    FROM item_batches b
    JOIN items i ON i.id = b.item_id
    WHERE b.org_id = ${orgId}
      AND b.quantity > 0
      AND b.expiry_date IS NOT NULL
      AND b.expiry_date > CURRENT_DATE
      AND b.expiry_date <= CURRENT_DATE + ${days}::int
      ${search ? sql`AND (i.name ILIKE ${'%' + search + '%'} OR i.sku ILIKE ${'%' + search + '%'})` : sql``}
    ORDER BY b.expiry_date ASC
  `;

  return rows.map((r) => {
    const daysRemaining = Math.ceil(
      (r.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: r.id,
      itemId: r.item_id,
      quantity: r.quantity,
      expiryDate: r.expiry_date.toISOString().slice(0, 10),
      itemName: r.item_name,
      itemSku: r.item_sku,
      itemUnit: r.item_unit,
      daysRemaining,
    };
  });
}

export function registerStockRoutes(fastify: FastifyInstance) {
  const staffUp = [
    fastify.authenticate,
    fastify.requireRole('admin', 'staff'),
  ] as const;

  fastify.post(
    '/api/v1/stock/in',
    { preHandler: [...staffUp] },
    async (request, reply) => {
      const data = await stockIn(
        fastify.db,
        request.authOrg.id,
        request.authUser.id,
        request.authOrg,
        request.body as never
      );
      return reply.send({ success: true, data: { transactions: data } });
    }
  );

  fastify.post(
    '/api/v1/stock/out',
    { preHandler: [...staffUp] },
    async (request, reply) => {
      const data = await stockOut(
        fastify.db,
        request.authOrg.id,
        request.authUser.id,
        request.authOrg,
        request.body as never
      );
      return reply.send({ success: true, data: { transactions: data } });
    }
  );

  fastify.get(
    '/api/v1/stock/out/preview',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { itemId, quantity } = request.query as {
        itemId: string;
        quantity: string;
      };
      const data = await previewStockOut(
        fastify.db,
        request.authOrg.id,
        itemId,
        Number(quantity)
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.get(
    '/api/v1/stock/expiring',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { days, search } = request.query as {
        days?: string;
        search?: string;
      };
      const data = await getExpiring(
        fastify.db,
        request.authOrg.id,
        Number(days) || 365,
        search
      );
      return reply.send({ success: true, data });
    }
  );
}
