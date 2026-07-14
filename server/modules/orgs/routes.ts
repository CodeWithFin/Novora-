import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export async function getOrgDetails(sql: Sql, orgId: string) {
  const [org] = await sql<
    {
      id: string;
      name: string;
      slug: string;
      email: string;
      is_active: boolean;
      created_at: Date;
      user_count: number;
    }[]
  >`
    SELECT o.id, o.name, o.slug, o.email, o.is_active, o.created_at,
           (SELECT COUNT(*)::int FROM users u WHERE u.org_id = o.id) AS user_count
    FROM organizations o WHERE o.id = ${orgId}
  `;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    isActive: org.is_active,
    createdAt: org.created_at.toISOString(),
    userCount: org.user_count,
  };
}

export async function updateOrg(
  sql: Sql,
  orgId: string,
  body: z.infer<typeof updateOrgSchema>
) {
  const parsed = updateOrgSchema.parse(body);
  const [org] = await sql<
    {
      id: string;
      name: string;
      slug: string;
      email: string;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    UPDATE organizations SET
      name = COALESCE(${parsed.name ?? null}, name),
      email = COALESCE(${parsed.email ?? null}, email),
      updated_at = now()
    WHERE id = ${orgId}
    RETURNING id, name, slug, email, is_active, created_at
  `;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    isActive: org.is_active,
    createdAt: org.created_at.toISOString(),
  };
}

export function registerOrgRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/orgs/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const data = await getOrgDetails(fastify.db, request.authOrg.id);
      return reply.send({ success: true, data });
    }
  );

  fastify.patch(
    '/api/v1/orgs/me',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request, reply) => {
      const data = await updateOrg(
        fastify.db,
        request.authOrg.id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );
}
