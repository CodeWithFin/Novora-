import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors.js';
import { hashPassword, verifyPassword } from '../../shared/crypto.js';

const updateUserSchema = z.object({
  role: z.enum(['admin', 'staff', 'viewer']).optional(),
  isActive: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function listUsers(sql: Sql, orgId: string) {
  const users = await sql<
    {
      id: string;
      org_id: string;
      email: string;
      display_name: string | null;
      role: string;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    SELECT id, org_id, email, display_name, role, is_active, created_at
    FROM users WHERE org_id = ${orgId}
    ORDER BY created_at ASC
  `;

  return users.map((u) => ({
    id: u.id,
    orgId: u.org_id,
    email: u.email,
    displayName: u.display_name,
    role: u.role as 'admin' | 'staff' | 'viewer',
    isActive: u.is_active,
    createdAt: u.created_at.toISOString(),
  }));
}

export async function updateUser(
  sql: Sql,
  orgId: string,
  userId: string,
  currentUserId: string,
  body: z.infer<typeof updateUserSchema>
) {
  if (userId === currentUserId) {
    throw new ForbiddenError('Cannot modify your own account');
  }

  const parsed = updateUserSchema.parse(body);
  const [user] = await sql<
    {
      id: string;
      org_id: string;
      email: string;
      display_name: string | null;
      role: string;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    UPDATE users SET
      role = COALESCE(${parsed.role ?? null}, role),
      is_active = COALESCE(${parsed.isActive ?? null}, is_active),
      updated_at = now()
    WHERE id = ${userId} AND org_id = ${orgId}
    RETURNING id, org_id, email, display_name, role, is_active, created_at
  `;

  if (!user) throw new NotFoundError('User not found');

  return {
    id: user.id,
    orgId: user.org_id,
    email: user.email,
    displayName: user.display_name,
    role: user.role as 'admin' | 'staff' | 'viewer',
    isActive: user.is_active,
    createdAt: user.created_at.toISOString(),
  };
}

export async function deleteUser(
  sql: Sql,
  orgId: string,
  userId: string,
  currentUserId: string
) {
  if (userId === currentUserId) {
    throw new ForbiddenError('Cannot delete your own account');
  }

  const [user] = await sql<{ id: string }[]>`
    DELETE FROM users WHERE id = ${userId} AND org_id = ${orgId}
    RETURNING id
  `;
  if (!user) throw new NotFoundError('User not found');
}

export async function changePassword(
  sql: Sql,
  userId: string,
  body: z.infer<typeof changePasswordSchema>
) {
  const parsed = changePasswordSchema.parse(body);
  const [user] = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${userId}
  `;
  if (!user) throw new NotFoundError('User not found');

  const valid = await verifyPassword(
    parsed.currentPassword,
    user.password_hash
  );
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const hash = await hashPassword(parsed.newPassword);
  await sql`UPDATE users SET password_hash = ${hash}, updated_at = now()
    WHERE id = ${userId}`;
}

export function registerUserRoutes(fastify: FastifyInstance) {
  const adminOnly = [
    fastify.authenticate,
    fastify.requireRole('admin'),
  ] as const;

  fastify.get(
    '/api/v1/users',
    { preHandler: [...adminOnly] },
    async (request, reply) => {
      const data = await listUsers(fastify.db, request.authOrg.id);
      return reply.send({ success: true, data });
    }
  );

  fastify.patch(
    '/api/v1/users/:id',
    { preHandler: [...adminOnly] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await updateUser(
        fastify.db,
        request.authOrg.id,
        id,
        request.authUser.id,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.delete(
    '/api/v1/users/:id',
    { preHandler: [...adminOnly] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteUser(
        fastify.db,
        request.authOrg.id,
        id,
        request.authUser.id
      );
      return reply.send({ success: true, data: { deleted: true } });
    }
  );

  fastify.patch(
    '/api/v1/users/me/password',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await changePassword(
        fastify.db,
        request.authUser.id,
        request.body as never
      );
      return reply.send({ success: true, data: { updated: true } });
    }
  );
}
