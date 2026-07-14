import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Sql } from '../../config/database.js';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../../shared/errors.js';
import {
  generateSlug,
  hashPassword,
  verifyPassword,
} from '../../shared/crypto.js';
import { mapOrg, mapUser } from '../../shared/guards.js';
import { sendWelcomeEmail } from '../notifications/service.js';

const signupSchema = z.object({
  orgName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function signup(sql: Sql, body: z.infer<typeof signupSchema>) {
  const parsed = signupSchema.parse(body);
  const [existing] = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${parsed.email}
  `;
  if (existing) throw new ConflictError('Email already registered');

  const slug = generateSlug(parsed.orgName);
  const passwordHash = await hashPassword(parsed.password);

  return sql.begin(async (tx) => {
    const [org] = await tx<
      {
        id: string;
        name: string;
        slug: string;
        email: string;
        is_active: boolean;
        created_at: Date;
      }[]
    >`
      INSERT INTO organizations (name, slug, email)
      VALUES (${parsed.orgName}, ${slug}, ${parsed.email})
      RETURNING id, name, slug, email, is_active, created_at
    `;

    const [user] = await tx<
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
      INSERT INTO users (org_id, email, password_hash, role)
      VALUES (${org.id}, ${parsed.email}, ${passwordHash}, 'admin')
      RETURNING id, org_id, email, display_name, role, is_active, created_at
    `;

    const mappedUser = mapUser(user);
    const mappedOrg = mapOrg(org);
    sendWelcomeEmail(mappedOrg, mappedUser);
    return { user: mappedUser, org: mappedOrg };
  });
}

export async function login(sql: Sql, body: z.infer<typeof loginSchema>) {
  const parsed = loginSchema.parse(body);
  const [user] = await sql<
    {
      id: string;
      org_id: string;
      email: string;
      display_name: string | null;
      role: string;
      is_active: boolean;
      created_at: Date;
      password_hash: string;
    }[]
  >`
    SELECT u.id, u.org_id, u.email, u.display_name, u.role,
           u.is_active, u.created_at, u.password_hash
    FROM users u WHERE u.email = ${parsed.email}
  `;

  if (!user || !(await verifyPassword(parsed.password, user.password_hash))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const [org] = await sql<
    {
      id: string;
      name: string;
      slug: string;
      email: string;
      is_active: boolean;
      created_at: Date;
    }[]
  >`SELECT id, name, slug, email, is_active, created_at
    FROM organizations WHERE id = ${user.org_id}`;

  if (!org) throw new UnauthorizedError('Organization not found');
  if (!org.is_active) throw new ForbiddenError('Organization is deactivated');
  if (!user.is_active) throw new ForbiddenError('Account is deactivated');

  return { user: mapUser(user), org: mapOrg(org) };
}

export async function acceptInvite(
  sql: Sql,
  body: z.infer<typeof acceptInviteSchema>
) {
  const parsed = acceptInviteSchema.parse(body);
  const [invite] = await sql<
    {
      id: string;
      org_id: string;
      email: string;
      role: string;
      expires_at: Date;
      accepted_at: Date | null;
    }[]
  >`SELECT id, org_id, email, role, expires_at, accepted_at
    FROM invites WHERE token = ${parsed.token}`;

  if (!invite) throw new NotFoundError('Invite not found');
  if (invite.accepted_at) throw new ValidationError('Invite already accepted');
  if (invite.expires_at < new Date()) throw new ValidationError('Invite expired');

  const [existingUser] = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${invite.email}
  `;
  if (existingUser) throw new ConflictError('Email already registered');

  const passwordHash = await hashPassword(parsed.password);

  return sql.begin(async (tx) => {
    const [user] = await tx<
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
      INSERT INTO users (org_id, email, password_hash, role)
      VALUES (${invite.org_id}, ${invite.email}, ${passwordHash}, ${invite.role})
      RETURNING id, org_id, email, display_name, role, is_active, created_at
    `;

    await tx`
      UPDATE invites SET accepted_at = now() WHERE id = ${invite.id}
    `;

    const [org] = await tx<
      {
        id: string;
        name: string;
        slug: string;
        email: string;
        is_active: boolean;
        created_at: Date;
      }[]
    >`SELECT id, name, slug, email, is_active, created_at
      FROM organizations WHERE id = ${invite.org_id}`;

    return { user: mapUser(user), org: mapOrg(org!) };
  });
}

export function registerAuthRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/auth/signup', async (request, reply) => {
    const result = await signup(fastify.db, request.body as never);
    const token = fastify.jwt.sign({
      userId: result.user.id,
      orgId: result.org.id,
      role: result.user.role,
    });
    return reply.send({ success: true, data: { token, ...result } });
  });

  fastify.post('/api/v1/auth/login', async (request, reply) => {
    const result = await login(fastify.db, request.body as never);
    const token = fastify.jwt.sign({
      userId: result.user.id,
      orgId: result.org.id,
      role: result.user.role,
    });
    return reply.send({ success: true, data: { token, ...result } });
  });

  fastify.get(
    '/api/v1/auth/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      return reply.send({
        success: true,
        data: { user: request.authUser, org: request.authOrg },
      });
    }
  );

  fastify.post('/api/v1/auth/accept-invite', async (request, reply) => {
    const result = await acceptInvite(fastify.db, request.body as never);
    const token = fastify.jwt.sign({
      userId: result.user.id,
      orgId: result.org.id,
      role: result.user.role,
    });
    return reply.send({ success: true, data: { token, ...result } });
  });
}
