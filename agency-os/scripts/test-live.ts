import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { testBrief } from '../workflows/test-brief.js';

const address = process.env.AGENCY_OS_URL ?? `http://localhost:${process.env.PORT ?? 3100}`;
async function request(url: string, body?: unknown) {
  const response = await fetch(address + url, { ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`);
  return result;
}

try {
  const config = await request('/api/config');
  if (!config.ready) throw new Error('The server has no OPENAI_API_KEY. Configure it in the server environment and restart before running the live test.');
  const { id } = await request('/api/runs', testBrief);
  console.log(`Live OpenAI workflow ${id}. Human approval remains manual at ${address}.`);
  const deadline = Date.now() + 10 * 60 * 1000;
  let previousProgress = '';
  while (Date.now() < deadline) {
    const run = await request(`/api/runs/${id}`);
    const progress = run.tasks.map((task: { stage: string; status: string; attempt: number }) => `${task.stage}: ${task.status} (attempt ${task.attempt})`).join(' | ');
    if (progress !== previousProgress) { console.log(progress); previousProgress = progress; }
    if (!['queued', 'running'].includes(run.status)) {
      await mkdir('test-results', { recursive: true });
      await writeFile('test-results/live-run.json', JSON.stringify({ validationMode: 'Live OpenAI workflow, persisted in application PostgreSQL.', ...run }, null, 2));
      if (run.status === 'awaiting_approval') {
        const quality = run.finalQuality;
        if (!quality || quality.iterations > config.qualityPolicy.maxCriticIterations || quality.qualityThreshold !== config.qualityPolicy.qualityThreshold) throw new Error('Live workflow did not preserve the configured quality policy.');
        if (run.evaluations.length !== quality.iterations || run.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'strategy').length !== quality.iterations || run.artifacts.filter((artifact: { kind: string }) => artifact.kind === 'critic').length !== quality.iterations) throw new Error('Live workflow iteration history is incomplete.');
        const final = run.artifacts.find((artifact: { kind: string }) => artifact.kind === 'final');
        if (final?.content.evaluationId !== run.evaluations.at(-1)?.id || run.approvals.length !== 0) throw new Error('Live workflow bypassed the final review or human decision gate.');
        for (const evaluation of run.evaluations) {
          const expectedVerdict = Number(evaluation.overall_score) >= quality.qualityThreshold ? 'PASS' : 'REVISE';
          if (evaluation.verdict !== expectedVerdict) throw new Error('Live evaluation verdict disagrees with its numerical quality gate.');
        }
        console.log('Verified iteration history, deterministic quality gate and mandatory pending human approval.');
      }
      console.log(JSON.stringify({ runId: id, status: run.status, agents: run.agentRuns, evaluations: run.evaluations, finalRecommendation: run.artifacts.find((artifact: { kind: string }) => artifact.kind === 'final')?.content, error: run.error }, null, 2));
      if (run.status !== 'awaiting_approval') process.exitCode = 1;
      break;
    }
    await delay(1000);
  }
  if (Date.now() >= deadline) throw new Error('Live test timed out. The persisted workflow may still be running; inspect it in the dashboard.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Live test failed. Start the server and check configuration.');
  process.exitCode = 1;
}