import type { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../shared/errors.js';
import { getOrgById, getUserById, mapOrg, mapUser } from '../shared/guards.js';

type AuthCacheEntry = {
  user: ReturnType<typeof mapUser>;
  org: ReturnType<typeof mapOrg>;
  expiresAt: number;
};

const AUTH_TTL_MS = 30_000;
const authCache = new Map<string, AuthCacheEntry>();

function cacheKey(userId: string, orgId: string) {
  return `${userId}:${orgId}`;
}

export function invalidateAuthCache(userId?: string, orgId?: string) {
  if (!userId && !orgId) {
    authCache.clear();
    return;
  }
  for (const key of authCache.keys()) {
    const [uid, oid] = key.split(':');
    if ((userId && uid === userId) || (orgId && oid === orgId)) {
      authCache.delete(key);
    }
  }
}

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const payload = await request.jwtVerify<{
      userId: string;
      orgId: string;
      role: string;
    }>();

    const key = cacheKey(payload.userId, payload.orgId);
    const cached = authCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      request.authUser = cached.user;
      request.authOrg = cached.org;
      return;
    }

    const [user, org] = await Promise.all([
      getUserById(request.server.db, payload.userId),
      getOrgById(request.server.db, payload.orgId),
    ]);

    if (!user) throw new UnauthorizedError('User not found');
    if (!org) throw new UnauthorizedError('Organization not found');
    if (!org.is_active) throw new ForbiddenError('Organization is deactivated');
    if (!user.is_active) throw new ForbiddenError('User account is deactivated');

    const mappedUser = mapUser(user);
    const mappedOrg = mapOrg(org);
    authCache.set(key, {
      user: mappedUser,
      org: mappedOrg,
      expiresAt: Date.now() + AUTH_TTL_MS,
    });

    request.authUser = mappedUser;
    request.authOrg = mappedOrg;
  } catch (err) {
    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}
