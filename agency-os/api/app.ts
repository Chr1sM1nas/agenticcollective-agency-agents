import Fastify from 'fastify';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { approvalSchema, briefSchema } from '../core/contracts.js';
import { AgentRegistry } from '../core/registry.js';
import { ConflictError, Store } from '../database/store.js';
import { testBrief } from '../workflows/test-brief.js';
import { DEFAULT_QUALITY_POLICY, type QualityPolicy } from '../core/quality.js';

const idSchema = z.string().uuid();
export function buildApp(options: { store: Store; registry: AgentRegistry; ready: boolean; model: string; qualityPolicy?: QualityPolicy; publicDirectory: string; wake: () => void }) {
  const app = Fastify({ logger: false, bodyLimit: 100000, requestTimeout: 10000 });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Cache-Control', 'no-store');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (request.method === 'POST') {
      const origin = request.headers.origin;
      if (origin) {
        let matches = false;
        try { matches = new URL(origin).host === request.headers.host; } catch {}
        if (!matches) return reply.code(403).send({ error: 'Cross-origin writes are not allowed.' });
      }
      if (request.headers['sec-fetch-site'] === 'cross-site') return reply.code(403).send({ error: 'Cross-site writes are not allowed.' });
      if (!request.headers['content-type']?.startsWith('application/json')) return reply.code(415).send({ error: 'Use application/json.' });
    }
  });
  for (const [url, file, contentType] of [['/', 'index.html', 'text/html; charset=utf-8'], ['/client.js', 'client.js', 'application/javascript; charset=utf-8'], ['/style.css', 'style.css', 'text/css; charset=utf-8']]) {
    app.get(url, async (_request, reply) => reply.type(contentType).send(await readFile(path.join(options.publicDirectory, file))));
  }
  app.get('/api/config', async () => ({ agency: 'Agentic Collective', deployment: 'Agency Zero', ready: options.ready, provider: 'openai', model: options.model, qualityPolicy: options.qualityPolicy ?? DEFAULT_QUALITY_POLICY, loadedAgents: options.registry.agents.length, registryWarnings: options.registry.warnings }));
  app.get('/api/test-brief', async () => testBrief);
  app.get('/api/runs', async () => options.store.list());
  app.post('/api/runs', async (request, reply) => {
    if (!options.ready) return reply.code(503).send({ error: 'OPENAI_API_KEY is not configured. Set it in the server environment and restart Agency OS.' });
    const brief = briefSchema.parse(request.body);
    const id = await options.store.create(brief, options.qualityPolicy ?? DEFAULT_QUALITY_POLICY);
    options.wake();
    return reply.code(202).send({ id });
  });
  app.get<{ Params: { id: string } }>('/api/runs/:id', async (request, reply) => {
    const detail = await options.store.detail(idSchema.parse(request.params.id));
    if (!detail) return reply.code(404).send({ error: 'Workflow not found.' });
    return detail;
  });
  app.post<{ Params: { id: string } }>('/api/runs/:id/approval', async (request) => {
    const id = idSchema.parse(request.params.id);
    const approval = approvalSchema.parse(request.body);
    await options.store.approve(id, approval.artifactId, approval.decision, approval.feedback);
    return options.store.detail(id);
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) return reply.code(400).send({ error: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') });
    if (error instanceof ConflictError) return reply.code(409).send({ error: error.message });
    if (error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) return reply.code(error.statusCode).send({ error: 'Invalid request.' });
    console.error('Agency OS request failed. Check PostgreSQL connectivity and schema.');
    return reply.code(500).send({ error: 'Request failed. Check server and database configuration.' });
  });
  return app;
}