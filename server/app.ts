import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import { AppError } from './shared/errors.js';
import dbPlugin from './plugins/db.js';
import jwtPlugin from './plugins/jwt.js';
import { authenticate } from './hooks/authenticate.js';
import { requireRole } from './hooks/requireRole.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerInviteRoutes } from './modules/invites/routes.js';
import { registerOrgRoutes } from './modules/orgs/routes.js';
import { registerUserRoutes } from './modules/users/routes.js';
import { registerItemRoutes } from './modules/items/routes.js';
import { registerStockRoutes } from './modules/stock/routes.js';
import { registerTransactionRoutes } from './modules/transactions/routes.js';
import { registerShopRoutes } from './modules/shops/routes.js';
import { registerDashboardRoutes } from './modules/dashboard/routes.js';
import { registerNotificationRoutes } from './modules/notifications/routes.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  await fastify.register(cors, { origin: true });
  await fastify.register(sensible);
  await fastify.register(dbPlugin);
  await fastify.register(jwtPlugin);

  fastify.decorate('authenticate', authenticate);
  fastify.decorate('requireRole', requireRole);

  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }

    if (error.validation) {
      return reply.status(422).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    fastify.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  fastify.get('/health', async () => ({ status: 'ok' }));

  registerAuthRoutes(fastify);
  registerInviteRoutes(fastify);
  registerOrgRoutes(fastify);
  registerUserRoutes(fastify);
  registerItemRoutes(fastify);
  registerStockRoutes(fastify);
  registerTransactionRoutes(fastify);
  registerShopRoutes(fastify);
  registerDashboardRoutes(fastify);
  registerNotificationRoutes(fastify);

  return fastify;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    requireRole: typeof requireRole;
  }
}
