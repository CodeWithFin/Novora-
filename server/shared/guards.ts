import type { Sql } from '../config/database.js';
import { NotFoundError } from './errors.js';

export async function getUserById(sql: Sql, userId: string) {
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
    SELECT id, org_id, email, display_name, role, is_active, created_at
    FROM users WHERE id = ${userId}
  `;
  return user ?? null;
}

export async function getOrgById(sql: Sql, orgId: string) {
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
    SELECT id, name, slug, email, is_active, created_at
    FROM organizations WHERE id = ${orgId}
  `;
  return org ?? null;
}

export async function requireItemInOrg(
  sql: Sql,
  itemId: string,
  orgId: string
) {
  const [item] = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM items
    WHERE id = ${itemId} AND org_id = ${orgId}
  `;
  if (!item) throw new NotFoundError('Item not found');
  return item;
}

export function mapUser(row: {
  id: string;
  org_id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role as 'admin' | 'staff' | 'viewer',
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapOrg(row: {
  id: string;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
  created_at: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    email: row.email,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}
