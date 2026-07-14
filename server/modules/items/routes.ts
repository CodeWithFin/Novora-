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

const createItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().default('pcs'),
  price: z.number().optional().nullable(),
  minStock: z.number().int().min(0).optional(),
});

const batchItemsSchema = z.object({
  items: z.array(createItemSchema).min(1),
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
      ${parsed.unit}, ${parsed.price ?? null}, ${parsed.minStock ?? 0}
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
  body: z.infer<typeof batchItemsSchema>
) {
  const parsed = batchItemsSchema.parse(body);
  let created = 0;
  let skipped = 0;

  await sql.begin(async (tx) => {
    for (const item of parsed.items) {
      const existing = await findExistingItem(
        tx as unknown as Sql,
        orgId,
        item.name,
        item.sku
      );
      if (existing) {
        skipped++;
        continue;
      }
      await tx`
        INSERT INTO items (org_id, name, sku, barcode, category, unit, price, min_stock)
        VALUES (
          ${orgId}, ${item.name}, ${item.sku ?? null},
          ${item.barcode ?? null}, ${item.category ?? null},
          ${item.unit}, ${item.price ?? null}, ${item.minStock ?? 0}
        )
      `;
      created++;
    }
  });

  return { created, skipped };
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
