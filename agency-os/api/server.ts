import 'dotenv/config';
import path from 'node:path';
import { Pool } from 'pg';
import { z } from 'zod';
import { buildApp } from './app.js';
import { AgentRegistry } from '../core/registry.js';
import { DEFAULT_MODEL, configuredRouter } from '../core/model-router.js';
import { Workflow } from '../core/workflow.js';
import { Worker } from '../core/worker.js';
import { Store } from '../database/store.js';
import { configuredQualityPolicy } from '../core/quality.js';

const configuration = z.object({ DATABASE_URL: z.string().min(1), PORT: z.coerce.number().int().min(1024).max(65535).default(3100) }).safeParse(process.env);
if (!configuration.success) {
  console.error('Set DATABASE_URL and a valid PORT in agency-os/.env. See .env.example and run npm run db:migrate.');
  process.exit(1);
}
const pool = new Pool({ connectionString: configuration.data.DATABASE_URL, max: 8, connectionTimeoutMillis: 5000 });
const store = new Store(pool);
const registry = await AgentRegistry.load(path.resolve(process.env.AGENT_LIBRARY_ROOT ?? '..'));
const router = configuredRouter(process.env);
const qualityPolicy = configuredQualityPolicy(process.env);
const worker = router ? new Worker(store, await Workflow.create(store, registry, router, process.cwd())) : null;
const app = buildApp({ store, registry, ready: !!router, model: router?.forTask().model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL, qualityPolicy, publicDirectory: path.resolve('dist/public'), wake: () => worker?.wake() });
let closing = false;
async function close(): Promise<void> {
  if (closing) return;
  closing = true;
  await app.close();
  await worker?.stop();
  await pool.end();
}
process.once('SIGINT', () => { void close(); });
process.once('SIGTERM', () => { void close(); });
pool.on('error', () => console.error('PostgreSQL connection lost. Check the database service.'));
try {
  const migration = await pool.query('SELECT version FROM schema_migrations WHERE version=2');
  if (!migration.rowCount) throw new Error('Run npm run db:migrate before starting Agency OS v0.2.');
  await worker?.start();
  await app.listen({ port: configuration.data.PORT, host: '127.0.0.1' });
  console.log(`Agentic Agency OS / Agency Zero: http://localhost:${configuration.data.PORT}`);
  console.log(`Loaded ${registry.agents.length} agent definitions. ${registry.warnings.join(' ')}`);
  if (!router) console.log('OPENAI_API_KEY is missing. Dashboard is available; execution is disabled until configuration and restart.');
} catch {
  console.error('Startup failed. Check DATABASE_URL, run npm run db:migrate, ensure no other worker is running, and choose an unused PORT.');
  await close();
  process.exitCode = 1;
}