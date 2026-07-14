import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { sendRequestAccessEmail } from '../notifications/service.js';

const requestAccessSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export function registerNotificationRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/notifications/request-access', async (request, reply) => {
    const parsed = requestAccessSchema.parse(request.body);
    sendRequestAccessEmail(parsed);
    return reply.send({ success: true, data: { sent: true } });
  });
}
