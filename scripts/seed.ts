import net from 'net';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { join } from 'path';
import postgres from 'postgres';

if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 30,
  ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon.tech')
    ? 'require'
    : undefined,
});

async function seed() {
  const seedPath = join(process.cwd(), 'db', 'seeds', 'dev_seed.sql');
  const sqlText = await readFile(seedPath, 'utf8');
  console.log('Seeding database...');
  await sql.unsafe(sqlText);
  console.log('Seed complete');
  console.log('Demo logins: admin@demo.com / staff@demo.com — password123');
  await sql.end();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await sql.end();
  process.exit(1);
});
