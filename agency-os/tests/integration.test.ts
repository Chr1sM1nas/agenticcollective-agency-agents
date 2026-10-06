import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { AgentRegistry } from '../core/registry.js';
import { ModelRouter } from '../core/model-router.js';
import { Workflow } from '../core/workflow.js';
import { migrate } from '../database/migrate.js';
import { ConflictError, Store } from '../database/store.js';
import { testBrief } from '../workflows/test-brief.js';
import { FixtureProvider, fixtureResearch, fixtureStrategy } from './fixtures.js';
import { buildApp } from '../api/app.js';
import { DEFAULT_QUALITY_POLICY, finalQuality, QUALITY_EXHAUSTED, QUALITY_REACHED, type QualityPolicy } from '../core/quality.js';

test('PostgreSQL workflow integration (explicit fixture provider; no real LLM)', { skip: !process.env.TEST_DATABASE_URL }, async suite => {
  const schema = `agency_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
  const store = new Store(pool);
  const registry = await AgentRegistry.load(path.resolve('..'));
  async function run(mode: ConstructorParameters<typeof FixtureProvider>[0] = 'pass', policy: QualityPolicy = DEFAULT_QUALITY_POLICY) {
    const provider = new FixtureProvider(mode);
    const workflow = await Workflow.create(store, registry, new ModelRouter(provider), process.cwd());
    const id = await store.create(testBrief, policy);
    const claimed = await store.claim();
    assert.equal(claimed?.id, id);
    await workflow.execute(id, claimed!.brief, claimed!.qualityPolicy);
    return { id, provider, detail: (await store.detail(id))! };
  }
  try {
    await pool.query(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
    await pool.query('CREATE TABLE schema_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    await pool.query('INSERT INTO schema_migrations(version) VALUES (1)');
    const legacyClient = (await pool.query("INSERT INTO clients(agency_id,name) SELECT id,'Legacy Client' FROM agencies RETURNING id")).rows[0];
    const project = (await pool.query('INSERT INTO projects(client_id,deployment_id,brief) SELECT $1,id,$2 FROM deployments RETURNING id', [legacyClient.id, testBrief])).rows[0];
    const legacyId = (await pool.query("INSERT INTO workflow_runs(project_id,status) VALUES ($1,'awaiting_approval') RETURNING id", [project.id])).rows[0].id;
    const legacyStrategy = (await pool.query("INSERT INTO artifacts(workflow_run_id,kind,version,content) VALUES ($1,'strategy',1,$2) RETURNING id", [legacyId, fixtureStrategy])).rows[0].id;
    const legacyCritic = (await pool.query("INSERT INTO artifacts(workflow_run_id,kind,version,content) VALUES ($1,'critic',1,'{}') RETURNING id", [legacyId])).rows[0].id;
    const legacyEvaluation = (await pool.query("INSERT INTO evaluations(workflow_run_id,critic_artifact_id,strategy_artifact_id,scores,overall_score,verdict,feedback) VALUES ($1,$2,$3,'{}',$4,'PASS','{}') RETURNING id", [legacyId, legacyCritic, legacyStrategy, 50 / 6])).rows[0].id;
    const legacyFinal = (await pool.query("INSERT INTO artifacts(workflow_run_id,kind,version,content) VALUES ($1,'final',1,$2) RETURNING id", [legacyId, { strategyArtifactId: legacyStrategy, evaluationId: legacyEvaluation }])).rows[0].id;
    await migrate(pool);
    await migrate(pool);
    await suite.test('seed and migration are idempotent', async () => {
      assert.equal((await pool.query('SELECT count(*) FROM agencies')).rows[0].count, '1');
      assert.equal((await pool.query('SELECT name FROM deployments')).rows[0].name, 'Agency Zero');
      assert.deepEqual((await pool.query('SELECT version FROM schema_migrations ORDER BY version')).rows.map(row => row.version), [1, 2]);
    });
    await suite.test('migration preserves legacy PASS scores and human approval', async () => {
      const legacy = (await store.detail(legacyId))!;
      assert.equal(legacy.evaluations[0].verdict, 'PASS');
      assert.equal(Number(legacy.evaluations[0].quality_threshold), 7.5);
      assert.equal(legacy.quality_policy, null);
      await store.approve(legacyId, legacyFinal, 'approve', 'Legacy review preserved.');
      assert.equal((await store.detail(legacyId))!.status, 'approved');
    });
    await suite.test('API validates briefs, origins, IDs and missing credentials', async () => {
      const app = buildApp({ store, registry, ready: true, model: 'fixture', publicDirectory: path.resolve('dist/public'), wake: () => undefined });
      const unconfigured = buildApp({ store, registry, ready: false, model: 'unconfigured', publicDirectory: path.resolve('dist/public'), wake: () => undefined });
      try {
        assert.equal((await app.inject({ method: 'POST', url: '/api/runs', payload: {} })).statusCode, 400);
        assert.equal((await app.inject({ method: 'POST', url: '/api/runs', headers: { origin: 'https://untrusted.example' }, payload: testBrief })).statusCode, 403);
        assert.equal((await app.inject('/api/runs/not-a-uuid')).statusCode, 400);
        assert.equal((await app.inject(`/api/runs/${randomUUID()}`)).statusCode, 404);
        assert.equal((await unconfigured.inject({ method: 'POST', url: '/api/runs', payload: testBrief })).statusCode, 503);
        const response = await app.inject({ method: 'POST', url: '/api/runs', payload: testBrief });
        assert.equal(response.statusCode, 202);
        const id = response.json().id;
        assert.equal((await app.inject({ method: 'POST', url: `/api/runs/${id}/approval`, payload: { decision: 'approve', artifactId: randomUUID() } })).statusCode, 409);
        await store.finish(id, 'failed', 'API test cleanup.');
      } finally { await app.close(); await unconfigured.close(); }
    });
    await suite.test('PASS persists all stages and complete handoffs; approval is once-only', async () => {
      const { id, provider, detail } = await run();
      assert.equal(detail.status, 'awaiting_approval');
      assert.equal(detail.agentRuns.length, 4);
      assert.deepEqual(provider.requests.map(request => request.stage), ['director', 'research', 'strategy', 'critic']);
      assert.deepEqual((provider.requests[2].input as { research: unknown }).research, fixtureResearch);
      const persisted = (await pool.query("SELECT ar.input,ar.prompt_snapshot FROM agent_runs ar JOIN tasks t ON t.id=ar.task_id WHERE t.workflow_run_id=$1 AND t.stage='strategy'", [id])).rows[0];
      assert.deepEqual(persisted.input.research, fixtureResearch);
      assert.ok(persisted.prompt_snapshot.includes(registry.select('marketing/marketing-growth-hacker.md', 'strategy').markdown));
      assert.equal(detail.evaluations[0].verdict, 'PASS');
      assert.equal(Number(detail.evaluations[0].overall_score), 52 / 6);
      assert.equal(detail.finalQuality.qualityStatus, QUALITY_REACHED);
      assert.equal(detail.finalQuality.iterations, 1);
      assert.equal(detail.approvals.length, 0);
      assert.ok(detail.agentRuns.every((agent: { provider: string; input_tokens: null }) => agent.provider === 'fixture' && agent.input_tokens === null));
      const artifact = detail.artifacts.find((item: { kind: string }) => item.kind === 'final');
      await assert.rejects(store.approve(id, randomUUID(), 'approve', ''), ConflictError);
      await store.approve(id, artifact.id, 'approve', 'Reviewed locally.');
      await assert.rejects(store.approve(id, artifact.id, 'reject', ''), ConflictError);
      assert.equal((await store.detail(id))!.status, 'approved');
    });
    await suite.test('7.83 triggers revision with the full brief, plan, strategy and critique', async () => {
      const { provider, detail } = await run('revise_once');
      assert.equal(detail.status, 'awaiting_approval');
      assert.deepEqual(provider.requests.map(request => request.stage), ['director', 'research', 'strategy', 'critic', 'strategy', 'critic']);
      assert.deepEqual((provider.requests[4].input as { research: unknown }).research, fixtureResearch);
      assert.equal((provider.requests[4].input as { criticFeedback: { verdict: string } }).criticFeedback.verdict, 'REVISE');
      assert.equal(detail.evaluations.length, 2);
      assert.equal(Number(detail.evaluations[0].overall_score), 47 / 6);
      assert.equal(Number(detail.evaluations[0].quality_threshold), 8.5);
      assert.equal(detail.evaluations[0].verdict, 'REVISE');
      const revisedInput = provider.requests[4].input as { brief: unknown; plan: unknown; previousStrategy: unknown; criticFeedback: { weaknesses: string[]; recommendedImprovements: string[] }; iteration: number; revisionTrigger: { evaluationId: string; qualityThreshold: number }; revisionInstruction: string };
      assert.deepEqual(revisedInput.brief, testBrief);
      assert.deepEqual(revisedInput.plan, detail.plan);
      assert.deepEqual(revisedInput.previousStrategy, fixtureStrategy);
      assert.ok(revisedInput.criticFeedback.weaknesses.length);
      assert.ok(revisedInput.criticFeedback.recommendedImprovements.length);
      assert.equal(revisedInput.iteration, 2);
      assert.equal(revisedInput.revisionTrigger.evaluationId, detail.evaluations[0].id);
      assert.equal(revisedInput.revisionTrigger.qualityThreshold, 8.5);
      assert.match(revisedInput.revisionInstruction, /preserving the strongest elements/);
      assert.match(provider.requests[4].system, /Never invent statistics/);
      assert.match(provider.requests[2].system, /whatChanged must be \[\]/);
      assert.equal(detail.artifacts.filter((item: { kind: string }) => item.kind === 'strategy').length, 2);
    });
    await suite.test('third REVISE ends automation but still requires human review and permits explicit approval', async () => {
      const { id, provider, detail } = await run('always_revise');
      assert.equal(detail.status, 'awaiting_approval');
      assert.equal(provider.requests.length, 8);
      assert.equal(detail.evaluations.length, 3);
      assert.ok(detail.evaluations.every((evaluation: { verdict: string }) => evaluation.verdict === 'REVISE'));
      assert.equal(detail.finalQuality.qualityStatus, QUALITY_EXHAUSTED);
      assert.equal(detail.finalQuality.iterations, 3);
      assert.equal(detail.approvals.length, 0);
      const final = detail.artifacts.find((item: { kind: string }) => item.kind === 'final');
      const strategies = detail.artifacts.filter((item: { kind: string }) => item.kind === 'strategy');
      assert.deepEqual(strategies.map((item: { version: number }) => item.version), [1, 2, 3]);
      assert.equal(final.content.strategyArtifactId, strategies[2].id);
      assert.equal(final.content.evaluationId, detail.evaluations[2].id);
      await assert.rejects(store.approve(id, randomUUID(), 'approve', ''), ConflictError);
      await store.approve(id, final.id, 'approve', 'Reviewed despite outstanding quality concerns.');
      const approved = (await store.detail(id))!;
      assert.equal(approved.status, 'approved');
      assert.equal(approved.approvals[0].evaluation_id, detail.evaluations[2].id);
      assert.equal(approved.approvals[0].actor, 'local-human');
      await assert.rejects(pool.query('UPDATE tasks SET attempt=4 WHERE workflow_run_id=$1', [id]));
    });
    await suite.test('third PASS stops at three reviews and references Strategy v3', async () => {
      const { detail, provider } = await run('revise_twice');
      assert.equal(provider.requests.length, 8);
      assert.equal(detail.status, 'awaiting_approval');
      assert.equal(detail.finalQuality.qualityStatus, QUALITY_REACHED);
      assert.equal(detail.finalQuality.iterations, 3);
    });
    await suite.test('quality settings are snapshotted and the configured limit is respected', async () => {
      const policy = { qualityThreshold: 9, maxCriticIterations: 2 };
      const { detail, provider } = await run('pass', policy);
      assert.deepEqual(detail.quality_policy, policy);
      assert.equal(provider.requests.length, 6);
      assert.equal(detail.finalQuality.qualityStatus, QUALITY_EXHAUSTED);
      assert.equal(detail.finalQuality.iterations, 2);
      assert.equal(Number(detail.evaluations[0].quality_threshold), 9);
    });
    await suite.test('evidence requirements survive rewriting and are retained in the final audit', async () => {
      const { id, detail, provider } = await run('evidence');
      const input = provider.requests[4].input as { unresolvedEvidenceRequirements: string[] };
      assert.ok(input.unresolvedEvidenceRequirements.includes('Pilot evidence demonstrating delivery acceleration.'));
      assert.ok(input.unresolvedEvidenceRequirements.some(requirement => requirement.includes('Margin improvement')));
      assert.deepEqual(detail.evaluations[1].feedback.unresolvedEvidenceRequirements, []);
      assert.deepEqual(detail.unresolvedEvidenceRequirements, input.unresolvedEvidenceRequirements);
      assert.match(provider.requests[4].system, /Remove or soften unsupported claims/);
      const app = buildApp({ store, registry, ready: true, model: 'fixture', publicDirectory: path.resolve('dist/public'), wake: () => undefined });
      try {
        const response = await app.inject(`/api/runs/${id}`);
        const exported = response.json();
        assert.equal(exported.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'strategy').length, 2);
        assert.equal(exported.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'critic').length, 2);
        assert.deepEqual(exported.agentRuns[4].input, provider.requests[4].input);
        assert.match(exported.agentRuns[4].prompt_snapshot, /Never invent statistics/);
        assert.deepEqual(exported.unresolvedEvidenceRequirements, input.unresolvedEvidenceRequirements);
        assert.equal(exported.finalQuality.qualityStatus, QUALITY_REACHED);
        assert.ok(!response.body.includes('OPENAI_API_KEY'));
      } finally { await app.close(); }
    });
    for (const mode of ['revision_error', 'critic_error'] as const) {
      await suite.test(`${mode} preserves earlier artifacts and cannot enter approval`, async () => {
        const { id, detail } = await run(mode);
        assert.equal(detail.status, 'failed');
        assert.ok(detail.agentRuns.some((agent: { status: string }) => agent.status === 'failed'));
        assert.equal(detail.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'strategy').length, mode === 'critic_error' ? 2 : 1);
        assert.equal(detail.evaluations.length, 1);
        assert.equal(detail.approvals.length, 0);
        await assert.rejects(store.approve(id, randomUUID(), 'approve', ''), ConflictError);
        const strategy = detail.artifacts.find((artifact: { kind: string }) => artifact.kind === 'strategy');
        const research = detail.artifacts.find((artifact: { kind: string }) => artifact.kind === 'research');
        const evaluation = detail.evaluations[0];
        await pool.query("UPDATE workflow_runs SET status='running' WHERE id=$1", [id]);
        await assert.rejects(store.assemble(id, {
          objective: detail.plan.objective, recommendation: strategy.content.strategicRecommendation,
          strategy: strategy.content, researchArtifactId: research.id, strategyArtifactId: strategy.id,
          evaluationId: evaluation.id, finalQuality: finalQuality(Number(evaluation.overall_score), 3, DEFAULT_QUALITY_POLICY),
          unresolvedEvidenceRequirements: [],
        }), ConflictError);
        await store.finish(id, 'failed', 'Fixture failure preserved.');
      });
    }
    for (const mode of ['invalid_selection', 'invalid_research', 'false_source', 'provider_error'] as const) {
      await suite.test(`${mode} is recorded as failed and cannot deliver`, async () => {
        const { detail } = await run(mode);
        assert.equal(detail.status, 'failed');
        assert.ok(detail.agentRuns.some((agent: { status: string }) => agent.status === 'failed'));
        assert.equal(detail.artifacts.some((item: { kind: string }) => item.kind === 'final'), false);
      });
    }
    for (const decision of ['request_changes', 'reject']) {
      await suite.test(`${decision} persists human feedback without automatically restarting`, async () => {
        const { id, detail } = await run();
        const artifact = detail.artifacts.find((item: { kind: string }) => item.kind === 'final');
        await store.approve(id, artifact.id, decision, 'Please review the CEO proposition.');
        const updated = (await store.detail(id))!;
        assert.equal(updated.status, decision === 'reject' ? 'rejected' : 'changes_requested');
        assert.equal(updated.approvals[0].feedback, 'Please review the CEO proposition.');
        assert.equal(updated.agentRuns.length, 4);
      });
    }
    await suite.test('interrupted runs become explicit failures; queued work remains recoverable', async () => {
      const id = await store.create(testBrief);
      await store.claim();
      const queuedId = await store.create(testBrief);
      await store.recoverInterrupted();
      assert.equal((await store.detail(id))!.status, 'failed');
      assert.equal((await store.detail(queuedId))!.status, 'queued');
      await store.finish(queuedId, 'failed', 'Test cleanup.');
    });
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
});