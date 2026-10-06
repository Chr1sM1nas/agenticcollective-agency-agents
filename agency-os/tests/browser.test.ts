import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { chromium, type Browser } from 'playwright';
import { Pool } from 'pg';
import { buildApp } from '../api/app.js';
import { AgentRegistry } from '../core/registry.js';
import { ModelRouter } from '../core/model-router.js';
import { Workflow } from '../core/workflow.js';
import { Worker } from '../core/worker.js';
import { Store } from '../database/store.js';
import { migrate } from '../database/migrate.js';
import { FixtureProvider } from './fixtures.js';

for (const mode of ['evidence', 'always_revise'] as const) {
test(`desktop/mobile dashboard with PostgreSQL and ${mode} fixture provider`, { skip: !process.env.TEST_DATABASE_URL || process.env.RUN_BROWSER_TESTS !== '1', timeout: 90000 }, async () => {
  const schema = `agency_browser_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
  const store = new Store(pool);
  const registry = await AgentRegistry.load(path.resolve('..'));
  const provider = new FixtureProvider(mode);
  const workflow = await Workflow.create(store, registry, new ModelRouter(provider), process.cwd());
  const worker = new Worker(store, workflow);
  const app = buildApp({ store, registry, ready: true, model: provider.model, publicDirectory: path.resolve('dist/public'), wake: () => worker.wake() });
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    await migrate(pool);
    await worker.start();
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(address);
    await page.getByRole('button', { name: 'Load Test Brief' }).click();
    await page.waitForFunction(() => (document.getElementById('clientName') as HTMLInputElement).value === 'Agentic Collective');
    assert.equal(await page.locator('#run-agency').isEnabled(), true);
    await mkdir('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'RUN AGENCY' }).click();
    await page.waitForFunction(() => document.getElementById('workflow-status')?.textContent === 'Awaiting approval');
    const iterations = mode === 'evidence' ? 2 : 3;
    const score = mode === 'evidence' ? '8.67' : '7.83';
    const qualityStatus = mode === 'evidence' ? 'QUALITY THRESHOLD REACHED' : 'MAX ITERATIONS REACHED - HUMAN REVIEW REQUIRED';
    assert.ok((await page.locator('#progress').innerText()).includes(`${mode === 'evidence' ? 'PASS' : 'REVISE'} - ${score}/10`));
    assert.ok((await page.locator('#outputs').innerText()).includes('Model inference'));
    assert.equal(await page.locator('#iteration-history details').count(), iterations);
    assert.ok((await page.locator('#final-quality').innerText()).includes(qualityStatus));
    assert.ok((await page.locator('#final-quality').innerText()).includes('8.5'));
    assert.ok((await page.locator('#final-quality').innerText()).includes('AI quality is not human approval'));
    await page.locator('#iteration-history summary').first().click();
    assert.ok((await page.locator('#iteration-history details').first().innerText()).includes('REVISION REQUIRED'));
    if (mode === 'evidence') {
      assert.ok((await page.locator('#unresolved-evidence').innerText()).includes('Pilot evidence demonstrating delivery acceleration.'));
      assert.ok((await page.locator('#unresolved-evidence').innerText()).includes('Margin improvement'));
    }
    assert.equal(await page.getByRole('heading', { name: 'Final Recommendation', exact: true }).count(), 1);
    assert.equal(provider.requests.length, 2 + 2 * iterations);
    await page.screenshot({ path: 'test-results/result-desktop.png', fullPage: true });
    const id = await page.locator('#history').inputValue();
    const awaiting = (await store.detail(id))!;
    assert.equal(awaiting.evaluations.length, iterations);
    assert.equal(awaiting.approvals.length, 0);
    await page.getByRole('button', { name: 'APPROVE', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('workflow-status')?.textContent === 'Approved');
    assert.equal((await store.detail(id))!.approvals[0].decision, 'approve');
    assert.equal(await page.getByRole('button', { name: 'Download Approved Result' }).isVisible(), true);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Approved Result' }).click();
    const download = await downloadEvent;
    const downloadedPath = await download.path();
    assert.ok(downloadedPath);
    const exported = JSON.parse(await readFile(downloadedPath, 'utf8'));
    assert.equal(exported.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'strategy').length, iterations);
    assert.equal(exported.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'critic').length, iterations);
    assert.equal(exported.evaluations.length, iterations);
    assert.equal(exported.agentRuns.length, 2 + 2 * iterations);
    assert.equal(exported.finalQuality.qualityStatus, qualityStatus);
    assert.equal(exported.approvals[0].decision, 'approve');
    assert.equal(exported.approvals[0].evaluation_id, exported.evaluations.at(-1).id);
    assert.deepEqual(exported.unresolvedEvidenceRequirements, awaiting.unresolvedEvidenceRequirements);
    await page.reload();
    await page.locator('#history').selectOption(id);
    await page.waitForFunction(() => document.getElementById('workflow-status')?.textContent === 'Approved');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: 'test-results/result-mobile.png', fullPage: true });
    for (const decision of ['REQUEST CHANGES', 'REJECT']) {
      await page.getByRole('button', { name: 'RUN AGENCY' }).click();
      await page.waitForFunction(() => document.getElementById('workflow-status')?.textContent === 'Awaiting approval');
      if (decision === 'REQUEST CHANGES') {
        await page.getByRole('button', { name: decision, exact: true }).click();
        assert.ok((await page.locator('#error').innerText()).includes('Describe the requested changes'));
        await page.locator('#feedback').fill('Sharpen the CEO proposition and pilot measures.');
      }
      await page.getByRole('button', { name: decision, exact: true }).click();
      const expected = decision === 'REJECT' ? 'Rejected' : 'Changes requested';
      await page.waitForFunction(status => document.getElementById('workflow-status')?.textContent === status, expected);
    }
    assert.deepEqual(errors, []);
    await writeFile('test-results/fixture-report.json', JSON.stringify({ validationMode: 'Deterministic fixture provider. NOT a live OpenAI business result.', runId: id, status: 'approved', selectedAgents: awaiting.agentRuns.filter((agent: { stage: string }) => ['research', 'strategy'].includes(agent.stage)).map((agent: { agent_id: string }) => agent.agent_id), evaluations: awaiting.evaluations, finalRecommendation: awaiting.artifacts.find((artifact: { kind: string }) => artifact.kind === 'final')?.content, provider: provider.name, model: provider.model, tokens: null, estimatedCostUsd: null, database: 'Real PostgreSQL; isolated test schema removed after assertions.' }, null, 2));
    await page.close();
  } finally {
    await browser?.close();
    await app.close();
    await worker.stop();
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
});
}