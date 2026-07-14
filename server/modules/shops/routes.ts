import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';

const createShopSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().nullable(),
});

const updateShopSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

function mapShop(row: {
  id: string;
  org_id: string;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at: Date;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    location: row.location,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listShops(sql: Sql, orgId: string, activeOnly = false) {
  const shops = await sql<
    {
      id: string;
      org_id: string;
      name: string;
      location: string | null;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    SELECT id, org_id, name, location, is_active, created_at
    FROM shops
    WHERE org_id = ${orgId}
    ${activeOnly ? sql`AND is_active = true` : sql``}
    ORDER BY name ASC
  `;
  return shops.map(mapShop);
}

export async function createShop(
  sql: Sql,
  orgId: string,
  body: z.infer<typeof createShopSchema>
) {
  const parsed = createShopSchema.parse(body);
  const [shop] = await sql<
    {
      id: string;
      org_id: string;
      name: string;
      location: string | null;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    INSERT INTO shops (org_id, name, location)
    VALUES (${orgId}, ${parsed.name}, ${parsed.location ?? null})
    RETURNING id, org_id, name, location, is_active, created_at
  `;
  return mapShop(shop);
}

export async function updateShop(
  sql: Sql,
  orgId: string,
  shopId: string,
  body: z.infer<typeof updateShopSchema>
) {
  const parsed = updateShopSchema.parse(body);
  const [shop] = await sql<
    {
      id: string;
      org_id: string;
      name: string;
      location: string | null;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    UPDATE shops SET
      name = COALESCE(${parsed.name ?? null}, name),
      location = COALESCE(${parsed.location ?? null}, location),
      is_active = COALESCE(${parsed.isActive ?? null}, is_active)
    WHERE id = ${shopId} AND org_id = ${orgId}
    RETURNING id, org_id, name, location, is_active, created_at
  `;
  if (!shop) throw new NotFoundError('Shop not found');
  return mapShop(shop);
}

export async function deleteShop(sql: Sql, orgId: string, shopId: string) {
  const [shop] = await sql<{ id: string }[]>`
    DELETE FROM shops WHERE id = ${shopId} AND org_id = ${orgId}
    RETURNING id
  `;
  if (!shop) throw new NotFoundError('Shop not found');
}

export function registerShopRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/shops',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const data = await listShops(fastify.db, request.authOrg.id);
      return reply.send({ success: true, data });
    }
  );

  fastify.post(
    '/api/v1/shops',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request, reply) => {
      const data = await createShop(
        fastify.db,
        request.authOrg.id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.patch(
    '/api/v1/shops/:id',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await updateShop(
        fastify.db,
        request.authOrg.id,
        id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.delete(
    '/api/v1/shops/:id',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteShop(fastify.db, request.authOrg.id, id);
      return reply.send({ success: true, data: { deleted: true } });
    }
  );
}
