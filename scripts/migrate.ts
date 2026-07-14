import net from 'net';
import { config } from 'dotenv';
import { readdir, readFile } from 'fs/promises';
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

async function migrate() {
  const migrationsDir = join(process.cwd(), 'db', 'migrations');
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  const applied = await sql<{ id: string }[]>`
    SELECT id FROM schema_migrations ORDER BY id
  `;
  const appliedSet = new Set(applied.map((r) => r.id));

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`skip  ${file}`);
      continue;
    }

    const sqlText = await readFile(join(migrationsDir, file), 'utf8');
    console.log(`apply ${file}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(sqlText);
      await tx`INSERT INTO schema_migrations (id) VALUES (${file})`;
    });
  }

  console.log('Migrations complete');
  await sql.end();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await sql.end();
  process.exit(1);
});
