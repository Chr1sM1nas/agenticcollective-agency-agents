import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { fileURLToPath } from 'node:url';

export async function migrate(pool: Pool): Promise<void> {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const qualityLoop = await readFile(new URL('./quality-loop.sql', import.meta.url), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(72421001)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const applied = await client.query('SELECT version FROM schema_migrations WHERE version = 1');
    if (applied.rowCount === 0) {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES (1)');
    }
    const qualityApplied = await client.query('SELECT version FROM schema_migrations WHERE version = 2');
    if (qualityApplied.rowCount === 0) {
      await client.query(qualityLoop);
      await client.query('INSERT INTO schema_migrations(version) VALUES (2)');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the environment or agency-os/.env.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try { await migrate(pool); console.log('Schema ready. Seeded Agentic Collective / Agency Zero.'); }
  finally { await pool.end(); }
}