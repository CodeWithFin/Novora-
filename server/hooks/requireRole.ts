import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '../../shared/types/api.js';
import { ForbiddenError } from '../shared/errors.js';

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.authUser || !roles.includes(request.authUser.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
