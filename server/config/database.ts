import net from 'net';
import postgres from 'postgres';
import { env } from './env.js';

// Neon pooler host has both A + AAAA; Happy Eyeballs can stall TCP here.
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

const needsSsl =
  env.DATABASE_URL.includes('neon.tech') ||
  env.DATABASE_URL.includes('sslmode=require');

export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 60,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  prepare: false, // required with Neon/PgBouncer pooled connections
  ssl: needsSsl ? 'require' : undefined,
  connection: {
    application_name: 'novora',
  },
  onnotice: () => {},
});

sql`SELECT 1`
  .then(() => {
    console.log('Database connected');
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err.message);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// Keep a Neon pool connection warm so first API hits after idle aren't cold.
setInterval(() => {
  void sql`SELECT 1`.catch(() => {});
}, 55_000).unref?.();

export type Sql = typeof sql;
