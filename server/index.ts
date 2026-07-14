import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';
import { env } from './config/env.js';
import { buildApp } from './app.js';

async function main() {
  const dev = env.NODE_ENV !== 'production';
  const nextApp = next({ dev, dir: process.cwd() });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const fastify = await buildApp();
  // Must ready() before routing — and never replace fastify.server with the
  // outer Node server. Doing so makes emit('request') re-enter the outer
  // handler (infinite recursion / stack overflow) and hang all API calls.
  await fastify.ready();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '/', true);
    const pathname = parsedUrl.pathname ?? '/';

    if (pathname.startsWith('/api/v1') || pathname === '/health') {
      fastify.server.emit('request', req, res);
      return;
    }

    handle(req, res, parsedUrl).catch((err) => {
      console.error('Request error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
  });

  server.listen(env.PORT, env.HOST, () => {
    console.log(`Novora running on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
