import type { Role } from '../../shared/types/api.js';
import type { Org, User } from '../../shared/types/auth.js';

export interface JwtPayload {
  userId: string;
  orgId: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser: User;
    authOrg: Org;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
  }
}
