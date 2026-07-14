import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';
import { getStockStatus } from '../../../shared/utils/stock.js';
import {
  buildMeta,
  getPaginationOffset,
  parsePagination,
} from '../../shared/pagination.js';

const DEFAULT_MIN_STOCK = 10;

const createItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().default('pcs'),
  price: z.number().optional().nullable(),
  minStock: z.number().int().min(0).optional().default(DEFAULT_MIN_STOCK),
});

const batchItemSchema = createItemSchema.extend({
  quantity: z.number().int().positive().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

const batchItemsSchema = z.object({
  items: z.array(batchItemSchema).min(1),
});

function mapItem(row: Record<string, unknown>, batchesOverride?: unknown[]) {
  const totalStock = Number(row.total_stock ?? 0);
  const minStock = Number(row.min_stock ?? 0);
  const rawBatches = batchesOverride ?? row.batches;
  const batches = Array.isArray(rawBatches)
    ? rawBatches
    : typeof rawBatches === 'string'
      ? JSON.parse(rawBatches)
      : [];

  const createdAt = row.created_at;
  const updatedAt = row.updated_at;

  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    sku: (row.sku as string) ?? null,
    barcode: (row.barcode as string) ?? null,
    category: (row.category as string) ?? null,
    unit: (row.unit as string) ?? 'pcs',
    price: row.price != null ? Number(row.price) : null,
    minStock,
    totalStock,
    earliestExpiry: row.earliest_expiry
      ? row.earliest_expiry instanceof Date
        ? row.earliest_expiry.toISOString().slice(0, 10)
        : String(row.earliest_expiry).slice(0, 10)
      : null,
    batches: batches.map(
      (b: { id: string; quantity: number; expiry_date: string | null }) => ({
        id: b.id,
        quantity: b.quantity,
        expiry_date: b.expiry_date ? String(b.expiry_date).slice(0, 10) : null,
      })
    ),
    status: getStockStatus(totalStock, minStock),
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt),
    updatedAt:
      updatedAt instanceof Date
        ? updatedAt.toISOString()
        : String(updatedAt),
  };
}

async function findExistingItem(
  sql: Sql,
  orgId: string,
  name: string,
  sku?: string | null
) {
  if (sku) {
    const [bySku] = await sql<Record<string, unknown>[]>`
      SELECT * FROM items_with_stock
      WHERE org_id = ${orgId} AND sku = ${sku}
    `;
    if (bySku) return bySku;
  }
  const [byName] = await sql<Record<string, unknown>[]>`
    SELECT * FROM items_with_stock
    WHERE org_id = ${orgId} AND LOWER(name) = LOWER(${name})
  `;
  return byName ?? null;
}

export async function listItems(
  sql: Sql,
  orgId: string,
  query: Record<string, string | undefined>
) {
  const pagination = parsePagination(query);
  const { limit, offset } = getPaginationOffset(pagination);
  const search = query.search?.trim();
  const category = query.category?.trim();
  const status = query.status as 'ok' | 'low' | 'out' | undefined;
  const barcode = query.barcode?.trim();

  const [rows, countRow] = await Promise.all([
    sql<Record<string, unknown>[]>`
      SELECT * FROM items_with_stock
      WHERE org_id = ${orgId}
      ${search ? sql`AND (name ILIKE ${'%' + search + '%'} OR sku ILIKE ${'%' + search + '%'} OR barcode ILIKE ${'%' + search + '%'})` : sql``}
      ${category ? sql`AND category = ${category}` : sql``}
      ${barcode ? sql`AND barcode = ${barcode}` : sql``}
      ${
        status === 'out'
          ? sql`AND total_stock = 0`
          : status === 'low'
            ? sql`AND total_stock > 0 AND total_stock <= min_stock`
            : status === 'ok'
              ? sql`AND total_stock > min_stock`
              : sql``
      }
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM items_with_stock
      WHERE org_id = ${orgId}
      ${search ? sql`AND (name ILIKE ${'%' + search + '%'} OR sku ILIKE ${'%' + search + '%'} OR barcode ILIKE ${'%' + search + '%'})` : sql``}
      ${category ? sql`AND category = ${category}` : sql``}
      ${barcode ? sql`AND barcode = ${barcode}` : sql``}
      ${
        status === 'out'
          ? sql`AND total_stock = 0`
          : status === 'low'
            ? sql`AND total_stock > 0 AND total_stock <= min_stock`
            : status === 'ok'
              ? sql`AND total_stock > min_stock`
              : sql``
      }
    `,
  ]);

  const data = rows.map((row) => mapItem(row));
  return { data, meta: buildMeta(pagination, countRow[0]?.count ?? 0) };
}

export async function createItem(
  sql: Sql,
  orgId: string,
  body: z.infer<typeof createItemSchema>
) {
  const parsed = createItemSchema.parse(body);
  const existing = await findExistingItem(
    sql,
    orgId,
    parsed.name,
    parsed.sku
  );
  if (existing) return mapItem(existing);

  const [item] = await sql<Record<string, unknown>[]>`
    INSERT INTO items (org_id, name, sku, barcode, category, unit, price, min_stock)
    VALUES (
      ${orgId}, ${parsed.name}, ${parsed.sku ?? null},
      ${parsed.barcode ?? null}, ${parsed.category ?? null},
      ${parsed.unit}, ${parsed.price ?? null}, ${parsed.minStock ?? DEFAULT_MIN_STOCK}
    )
    RETURNING *
  `;

  const [withStock] = await sql<Record<string, unknown>[]>`
    SELECT * FROM items_with_stock WHERE id = ${item.id as string}
  `;
  return mapItem(withStock);
}

export async function batchCreateItems(
  sql: Sql,
  orgId: string,
  userId: string,
  body: z.infer<typeof batchItemsSchema>
) {
  const parsed = batchItemsSchema.parse(body);
  const txDate = new Date().toISOString().slice(0, 10);

  // Deduplicate payload rows (first wins) so a sheet isn't 2× work.
  const uniqueItems: typeof parsed.items = [];
  const seenKeys = new Set<string>();
  for (const item of parsed.items) {
    const key = item.sku
      ? `sku:${item.sku.toLowerCase()}`
      : `name:${item.name.toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    uniqueItems.push(item);
  }

  return sql.begin(async (tx) => {
    // One lightweight read — avoid items_with_stock (json_agg) per row.
    const existingRows = await tx<
      { id: string; name: string; sku: string | null }[]
    >`
      SELECT id, name, sku FROM items WHERE org_id = ${orgId}
    `;

    const bySku = new Map<string, string>();
    const byName = new Map<string, string>();
    for (const row of existingRows) {
      if (row.sku) bySku.set(row.sku.toLowerCase(), row.id);
      byName.set(row.name.toLowerCase(), row.id);
    }

    type NewItem = {
      name: string;
      sku: string | null;
      barcode: string | null;
      category: string | null;
      unit: string;
      price: number | null;
      minStock: number;
    };

    const toInsert: NewItem[] = [];
    const resolved: {
      itemId: string | null;
      item: (typeof uniqueItems)[number];
      insertIndex: number;
    }[] = [];

    for (const item of uniqueItems) {
      const existingId = item.sku
        ? bySku.get(item.sku.toLowerCase())
        : undefined;
      const byNameId = byName.get(item.name.toLowerCase());
      const foundId = existingId ?? byNameId ?? null;

      if (foundId) {
        resolved.push({ itemId: foundId, item, insertIndex: -1 });
      } else {
        resolved.push({ itemId: null, item, insertIndex: toInsert.length });
        toInsert.push({
          name: item.name,
          sku: item.sku ?? null,
          barcode: item.barcode ?? null,
          category: item.category ?? null,
          unit: item.unit,
          price: item.price ?? null,
          minStock: item.minStock ?? DEFAULT_MIN_STOCK,
        });
      }
    }

    let insertedIds: string[] = [];
    if (toInsert.length > 0) {
      const names = toInsert.map((i) => i.name);
      const skus = toInsert.map((i) => i.sku ?? '');
      const barcodes = toInsert.map((i) => i.barcode ?? '');
      const categories = toInsert.map((i) => i.category ?? '');
      const units = toInsert.map((i) => i.unit);
      const prices = toInsert.map((i) => i.price);
      const minStocks = toInsert.map((i) => i.minStock);

      const inserted = await tx<{ id: string }[]>`
        INSERT INTO items (org_id, name, sku, barcode, category, unit, price, min_stock)
        SELECT
          ${orgId},
          t.name,
          NULLIF(t.sku, ''),
          NULLIF(t.barcode, ''),
          NULLIF(t.category, ''),
          t.unit,
          t.price,
          t.min_stock
        FROM unnest(
          ${tx.array(names)}::text[],
          ${tx.array(skus)}::text[],
          ${tx.array(barcodes)}::text[],
          ${tx.array(categories)}::text[],
          ${tx.array(units)}::text[],
          ${tx.array(prices)}::numeric[],
          ${tx.array(minStocks)}::int[]
        ) AS t(name, sku, barcode, category, unit, price, min_stock)
        RETURNING id
      `;
      insertedIds = inserted.map((r) => r.id);

      toInsert.forEach((row, i) => {
        const id = insertedIds[i];
        if (row.sku) bySku.set(row.sku.toLowerCase(), id);
        byName.set(row.name.toLowerCase(), id);
      });
    }

    const stockItemIds: string[] = [];
    const stockQtys: number[] = [];
    const stockExpiries: string[] = [];
    const txItemIds: string[] = [];
    const txQtys: number[] = [];

    let skipped = 0;
    let created = 0;

    for (const entry of resolved) {
      const itemId =
        entry.itemId ??
        (entry.insertIndex >= 0 ? insertedIds[entry.insertIndex] : null);
      if (!itemId) continue;

      if (entry.itemId) skipped++;
      else created++;

      const qty = entry.item.quantity ?? null;
      if (qty == null || qty <= 0) continue;

      const expiry = entry.item.expiryDate?.trim() || '';
      stockItemIds.push(itemId);
      stockQtys.push(qty);
      stockExpiries.push(expiry);
      txItemIds.push(itemId);
      txQtys.push(qty);
    }

    if (stockItemIds.length > 0) {
      await tx`
        INSERT INTO item_batches (org_id, item_id, quantity, expiry_date)
        SELECT
          ${orgId},
          t.item_id::uuid,
          t.quantity,
          NULLIF(t.expiry_date, '')::date
        FROM unnest(
          ${tx.array(stockItemIds)}::text[],
          ${tx.array(stockQtys)}::int[],
          ${tx.array(stockExpiries)}::text[]
        ) AS t(item_id, quantity, expiry_date)
      `;

      await tx`
        INSERT INTO transactions (
          org_id, item_id, type, quantity, notes,
          transaction_date, created_by
        )
        SELECT
          ${orgId},
          t.item_id::uuid,
          'IN',
          t.quantity,
          'Bulk import',
          ${txDate}::date,
          ${userId}::uuid
        FROM unnest(
          ${tx.array(txItemIds)}::text[],
          ${tx.array(txQtys)}::int[]
        ) AS t(item_id, quantity)
      `;
    }

    return {
      created,
      skipped,
      stocked: stockItemIds.length,
    };
  });
}
export async function getItem(sql: Sql, orgId: string, itemId: string) {
  const [item] = await sql<Record<string, unknown>[]>`
    SELECT * FROM items_with_stock
    WHERE id = ${itemId} AND org_id = ${orgId}
  `;
  if (!item) throw new NotFoundError('Item not found');

  const batches = await sql<
    { id: string; quantity: number; expiry_date: string | null }[]
  >`
    SELECT id, quantity, expiry_date
    FROM item_batches
    WHERE item_id = ${itemId} AND quantity > 0
    ORDER BY expiry_date NULLS LAST
  `;

  return mapItem(item, batches);
}

export async function updateItem(
  sql: Sql,
  orgId: string,
  itemId: string,
  body: Partial<z.infer<typeof createItemSchema>>
) {
  const parsed = createItemSchema.partial().parse(body);
  const [item] = await sql<Record<string, unknown>[]>`
    UPDATE items SET
      name = COALESCE(${parsed.name ?? null}, name),
      sku = COALESCE(${parsed.sku ?? null}, sku),
      barcode = COALESCE(${parsed.barcode ?? null}, barcode),
      category = COALESCE(${parsed.category ?? null}, category),
      unit = COALESCE(${parsed.unit ?? null}, unit),
      price = COALESCE(${parsed.price ?? null}, price),
      min_stock = COALESCE(${parsed.minStock ?? null}, min_stock),
      updated_at = now()
    WHERE id = ${itemId} AND org_id = ${orgId}
    RETURNING id
  `;
  if (!item) throw new NotFoundError('Item not found');
  return getItem(sql, orgId, itemId);
}

export async function deleteItem(sql: Sql, orgId: string, itemId: string) {
  const [item] = await sql<{ id: string }[]>`
    DELETE FROM items WHERE id = ${itemId} AND org_id = ${orgId}
    RETURNING id
  `;
  if (!item) throw new NotFoundError('Item not found');
}


export function registerItemRoutes(fastify: FastifyInstance) {
  const auth = [fastify.authenticate] as const;
  const staffUp = [
    fastify.authenticate,
    fastify.requireRole('admin', 'staff'),
  ] as const;

  fastify.get(
    '/api/v1/items',
    { preHandler: [...auth] },
    async (request, reply) => {
      const result = await listItems(
        fastify.db,
        request.authOrg.id,
        request.query as Record<string, string>
      );
      return reply.send({ success: true, ...result });
    }
  );

  fastify.post(
    '/api/v1/items',
    { preHandler: [...staffUp] },
    async (request, reply) => {
      const data = await createItem(
        fastify.db,
        request.authOrg.id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.post(
    '/api/v1/items/batch',
    { preHandler: [...staffUp] },
    async (request, reply) => {
      const data = await batchCreateItems(
        fastify.db,
        request.authOrg.id,
        request.authUser.id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.get(
    '/api/v1/items/:id',
    { preHandler: [...auth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await getItem(fastify.db, request.authOrg.id, id);
      return reply.send({ success: true, data });
    }
  );

  fastify.patch(
    '/api/v1/items/:id',
    { preHandler: [...staffUp] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await updateItem(
        fastify.db,
        request.authOrg.id,
        id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.delete(
    '/api/v1/items/:id',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteItem(fastify.db, request.authOrg.id, id);
      return reply.send({ success: true, data: { deleted: true } });
    }
  );
}
