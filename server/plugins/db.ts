import fp from 'fastify-plugin';
import type { Sql } from '../config/database.js';
import { sql } from '../config/database.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Sql;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('db', sql);
});
