import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { generateInviteToken } from '../../shared/crypto.js';
import { sendInviteEmail } from '../notifications/service.js';

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'staff', 'viewer']).default('staff'),
});

export async function createInvite(
  sql: Sql,
  orgId: string,
  org: { name: string },
  body: z.infer<typeof createInviteSchema>
) {
  const parsed = createInviteSchema.parse(body);
  const [existing] = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${parsed.email}
  `;
  if (existing) throw new ConflictError('User with this email already exists');

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [invite] = await sql<
    {
      id: string;
      org_id: string;
      email: string;
      role: string;
      token: string;
      expires_at: Date;
      accepted_at: Date | null;
      created_at: Date;
    }[]
  >`
    INSERT INTO invites (org_id, email, role, token, expires_at)
    VALUES (${orgId}, ${parsed.email}, ${parsed.role}, ${token}, ${expiresAt})
    RETURNING id, org_id, email, role, token, expires_at, accepted_at, created_at
  `;

  sendInviteEmail(
    { email: invite.email, token: invite.token, role: invite.role },
    org
  );

  return mapInvite(invite);
}

export async function listInvites(sql: Sql, orgId: string) {
  const invites = await sql<
    {
      id: string;
      org_id: string;
      email: string;
      role: string;
      token: string;
      expires_at: Date;
      accepted_at: Date | null;
      created_at: Date;
    }[]
  >`
    SELECT id, org_id, email, role, token, expires_at, accepted_at, created_at
    FROM invites
    WHERE org_id = ${orgId}
      AND accepted_at IS NULL
      AND expires_at > now()
    ORDER BY created_at DESC
  `;
  return invites.map(mapInvite);
}

export async function deleteInvite(
  sql: Sql,
  orgId: string,
  inviteId: string
) {
  const [invite] = await sql<{ id: string }[]>`
    DELETE FROM invites
    WHERE id = ${inviteId} AND org_id = ${orgId}
    RETURNING id
  `;
  if (!invite) throw new NotFoundError('Invite not found');
}

function mapInvite(row: {
  id: string;
  org_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role as 'admin' | 'staff' | 'viewer',
    token: row.token,
    expiresAt: row.expires_at.toISOString(),
    acceptedAt: row.accepted_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export function registerInviteRoutes(fastify: FastifyInstance) {
  const adminOnly = [
    fastify.authenticate,
    fastify.requireRole('admin'),
  ] as const;

  fastify.post(
    '/api/v1/invites',
    { preHandler: [...adminOnly] },
    async (request, reply) => {
      const data = await createInvite(
        fastify.db,
        request.authOrg.id,
        request.authOrg,
        request.body as never
      );
      return reply.send({ success: true, data });
    }
  );

  fastify.get(
    '/api/v1/invites',
    { preHandler: [...adminOnly] },
    async (request, reply) => {
      const data = await listInvites(fastify.db, request.authOrg.id);
      return reply.send({ success: true, data });
    }
  );

  fastify.delete(
    '/api/v1/invites/:id',
    { preHandler: [...adminOnly] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteInvite(fastify.db, request.authOrg.id, id);
      return reply.send({ success: true, data: { deleted: true } });
    }
  );
}
