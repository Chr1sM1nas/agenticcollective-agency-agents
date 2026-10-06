import type { ClientBrief } from '../core/contracts.js';
import type { FinalQuality, QualityPolicy } from '../core/quality.js';

interface Artifact { id: string; kind: string; version: number; content: Record<string, unknown> }
interface Review { id: string; strategy_artifact_id: string; critic_artifact_id: string; scores: Record<string, number>; overall_score: string; quality_threshold: string; verdict: string; feedback: Record<string, unknown> }
interface AgentRun {
  stage: string; attempt: number; status: string; error: string | null;
  agent_name: string; provider: string; model: string; duration_ms: number | null;
  input_tokens: number | null; output_tokens: number | null; estimated_cost_usd: string | null;
}
interface Run {
  id: string; status: string; brief: ClientBrief; error: string | null;
  quality_policy: QualityPolicy | null; finalQuality: FinalQuality | null; unresolvedEvidenceRequirements: string[];
  tasks: { stage: string; status: string; attempt: number }[];
  agentRuns: AgentRun[];
  artifacts: Artifact[]; evaluations: Review[]; approvals: { decision: string; feedback: string }[];
}
function element<ElementType extends HTMLElement>(id: string): ElementType {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element ${id}`);
  return found as ElementType;
}
function node(tag: string, text = ''): HTMLElement {
  const result = document.createElement(tag);
  result.textContent = text;
  return result;
}
async function api<Result>(url: string, body?: unknown): Promise<Result> {
  const response = await fetch(url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data as Result;
}
function showError(error: unknown): void {
  element('error').hidden = false;
  element('error').textContent = error instanceof Error ? error.message : 'Request failed.';
}
function title(key: string): string { return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, first => first.toUpperCase()); }
function renderValue(parent: HTMLElement, value: unknown): void {
  if (Array.isArray(value)) {
    if (value.length === 0) { parent.append(node('p', 'None identified.')); return; }
    const list = node('ul');
    for (const item of value) { const entry = node('li'); renderValue(entry, item); list.append(entry); }
    parent.append(list);
  } else if (value && typeof value === 'object') {
    for (const [key, content] of Object.entries(value)) { parent.append(node('h3', title(key))); renderValue(parent, content); }
  } else parent.append(node('p', String(value ?? 'Not available')));
}
function section(heading: string, content: unknown): HTMLElement {
  const area = node('section');
  area.append(node('h2', heading));
  renderValue(area, content);
  element('outputs').append(area);
  return area;
}
function renderIterations(run: Run, expanded: Set<string>): void {
  const agents = run.agentRuns.filter(agent => agent.stage === 'strategy' || agent.stage === 'critic');
  if (!agents.length) return;
  const history = node('section');
  history.id = 'iteration-history';
  history.append(node('h2', 'Iteration History'));
  const count = Math.max(...agents.map(agent => agent.attempt));
  for (let iteration = 1; iteration <= count; iteration += 1) {
    const strategy = run.artifacts.find(artifact => artifact.kind === 'strategy' && artifact.version === iteration);
    const critic = run.artifacts.find(artifact => artifact.kind === 'critic' && artifact.version === iteration);
    const review = run.evaluations.find(item => item.strategy_artifact_id === strategy?.id && item.critic_artifact_id === critic?.id);
    const details = document.createElement('details');
    details.dataset.iteration = String(iteration);
    details.open = expanded.has(String(iteration));
    const summary = node('summary', `Iteration ${iteration}`);
    details.append(summary);
    if (review) {
      const maximum = run.quality_policy?.maxCriticIterations;
      const status = review.verdict === 'PASS' ? 'QUALITY THRESHOLD REACHED' :
        iteration === maximum ? 'MAX ITERATIONS REACHED - HUMAN REVIEW REQUIRED' : 'REVISION REQUIRED';
      summary.textContent += ` - ${Number(review.overall_score).toFixed(2)}/10 - ${status}`;
      details.append(node('p', `Score: ${Number(review.overall_score).toFixed(2)} / 10 | Threshold: ${review.quality_threshold} | ${status}`));
      if (review.verdict === 'REVISE') details.append(node('p', `Reason: Quality score below threshold.${iteration === maximum ? ' Automatic revision limit reached; human review is required.' : ''}`));
    }
    for (const stage of ['strategy', 'critic']) {
      const agent = agents.find(item => item.stage === stage && item.attempt === iteration);
      details.append(node('h3', `${title(stage)} v${iteration}`));
      details.append(node('p', agent ? `${agent.agent_name}: ${title(agent.status)}` : 'Pending'));
      if (agent) {
        renderValue(details, {
          provider: agent.provider, model: agent.model, durationMs: agent.duration_ms,
          inputTokens: agent.input_tokens, outputTokens: agent.output_tokens, estimatedCostUsd: agent.estimated_cost_usd,
        });
        if (agent.error) details.append(node('p', agent.error));
      }
      const artifact = stage === 'strategy' ? strategy : critic;
      if (artifact) renderValue(details, artifact.content);
    }
    history.append(details);
  }
  element('outputs').append(history);
}
let selected: Run | null = null;
let selectedId: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let ready = false;
let approvalBusy = false;
const terminal = new Set(['awaiting_approval', 'approved', 'changes_requested', 'rejected', 'needs_review', 'failed']);

function populate(brief: ClientBrief): void {
  for (const [key, value] of Object.entries(brief)) element<HTMLInputElement | HTMLTextAreaElement>(key).value = value;
}
function render(run: Run): void {
  const expanded = new Set<string>();
  if (selected?.id === run.id) {
    for (const details of document.querySelectorAll<HTMLDetailsElement>('#iteration-history details[open]')) {
      if (details.dataset.iteration) expanded.add(details.dataset.iteration);
    }
  }
  selected = run;
  element('workflow-status').textContent = title(run.status);
  element('progress').replaceChildren();
  for (const stage of ['director', 'research', 'strategy', 'critic']) {
    const task = run.tasks.find(item => item.stage === stage);
    const agent = run.agentRuns.filter(item => item.stage === stage).at(-1);
    const status = task?.status ?? 'pending';
    const step = node('li');
    step.className = status;
    step.append(node('strong', stage === 'director' ? 'AGENCY DIRECTOR' : stage.toUpperCase()));
    let text = title(status);
    const review = run.evaluations.at(-1);
    if (stage === 'critic' && status === 'complete' && review) text = `${review.verdict} - ${Number(review.overall_score).toFixed(2)}/10`;
    step.append(node('span', text));
    if (agent) step.append(node('small', `${agent.agent_name}${(task?.attempt ?? 0) > 1 ? ' / revision' : ''}`));
    element('progress').append(step);
  }
  element('run-error').hidden = !run.error;
  element('run-error').textContent = run.error ?? '';
  const duration = run.agentRuns.reduce((sum, agent) => sum + (agent.duration_ms ?? 0), 0);
  const tokenKnown = run.agentRuns.length > 0 && run.agentRuns.every(agent => agent.input_tokens !== null && agent.output_tokens !== null);
  const tokens = run.agentRuns.reduce((sum, agent) => sum + (agent.input_tokens ?? 0) + (agent.output_tokens ?? 0), 0);
  const costKnown = run.agentRuns.length > 0 && run.agentRuns.every(agent => agent.estimated_cost_usd !== null);
  const cost = run.agentRuns.reduce((sum, agent) => sum + Number(agent.estimated_cost_usd ?? 0), 0);
  const models = [...new Set(run.agentRuns.map(agent => `${agent.provider} / ${agent.model}`))].join(', ');
  element('usage').textContent = run.agentRuns.length ? `${models} | ${(duration / 1000).toFixed(1)}s | Tokens: ${tokenKnown ? tokens : 'unavailable'} | Est. cost: ${costKnown ? '$' + cost.toFixed(5) : 'unavailable'}` : '';
  element('outputs').replaceChildren();
  const latest = (kind: string) => run.artifacts.filter(artifact => artifact.kind === kind).at(-1);
  if (latest('research')) section('Research', latest('research')!.content);
  if (latest('strategy')) section('Strategy', latest('strategy')!.content);
  renderIterations(run, expanded);
  if (run.finalQuality) {
    const quality = section('Final AI Quality', {
      finalQualityScore: Number(run.finalQuality.finalQualityScore).toFixed(2),
      qualityThreshold: run.finalQuality.qualityThreshold,
      iterations: run.finalQuality.iterations,
      qualityStatus: run.finalQuality.qualityStatus,
    });
    quality.id = 'final-quality';
    quality.append(node('p', 'AI quality is not human approval. A human must approve, reject or request changes.'));
    const evidence = section('Unresolved Evidence Requirements', run.unresolvedEvidenceRequirements);
    evidence.id = 'unresolved-evidence';
  }
  const final = latest('final');
  if (final) section('Final Recommendation', final.content.recommendation);
  if (run.approvals.length) section('Human Decision', run.approvals.at(-1));
  element('approval').hidden = run.status !== 'awaiting_approval';
  element('download').hidden = run.status !== 'approved';
}
async function history(): Promise<void> {
  const runs = await api<{ id: string; status: string; client: string; objective: string }[]>('/api/runs');
  const select = element<HTMLSelectElement>('history');
  select.replaceChildren(new Option('Select a workflow', ''));
  for (const run of runs) select.add(new Option(`${run.client} / ${title(run.status)} / ${run.objective}`, run.id));
  select.value = selectedId ?? '';
}
async function poll(id: string): Promise<void> {
  try {
    const run = await api<Run>(`/api/runs/${id}`);
    if (id !== selectedId) return;
    render(run);
    if (!terminal.has(run.status)) timer = setTimeout(() => { void poll(id); }, 800);
    else await history();
  } catch (error) {
    showError(error);
    if (id === selectedId) timer = setTimeout(() => { void poll(id); }, 3000);
  }
}
function selectRun(id: string): void {
  if (timer) clearTimeout(timer);
  selectedId = id;
  element<HTMLTextAreaElement>('feedback').value = '';
  void poll(id);
}
element<HTMLFormElement>('brief-form').addEventListener('submit', async event => {
  event.preventDefault();
  element('error').hidden = true;
  const button = element<HTMLButtonElement>('run-agency');
  button.disabled = true;
  try {
    const brief = Object.fromEntries(new FormData(element<HTMLFormElement>('brief-form')).entries());
    const run = await api<{ id: string }>('/api/runs', brief);
    selectRun(run.id);
    await history();
  } catch (error) { showError(error); }
  finally { button.disabled = !ready; }
});
element('load-example').addEventListener('click', async () => {
  try { populate(await api<ClientBrief>('/api/test-brief')); } catch (error) { showError(error); }
});
element<HTMLSelectElement>('history').addEventListener('change', async event => {
  const id = (event.target as HTMLSelectElement).value;
  if (!id) return;
  selectRun(id);
  try { populate((await api<Run>(`/api/runs/${id}`)).brief); } catch (error) { showError(error); }
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-decision]')) {
  button.addEventListener('click', async () => {
    if (approvalBusy) return;
    const run = selected;
    const artifact = run?.artifacts.find(item => item.kind === 'final');
    if (!run || !artifact) return;
    const feedback = element<HTMLTextAreaElement>('feedback').value.trim();
    if (button.dataset.decision === 'request_changes' && !feedback) { showError(new Error('Describe the requested changes in Feedback.')); element('feedback').focus(); return; }
    approvalBusy = true;
    const buttons = document.querySelectorAll<HTMLButtonElement>('[data-decision]');
    buttons.forEach(item => { item.disabled = true; });
    try {
      element('error').hidden = true;
      const updated = await api<Run>(`/api/runs/${run.id}/approval`, { decision: button.dataset.decision, feedback, artifactId: artifact.id });
      if (selectedId === updated.id) render(updated);
      await history();
    } catch (error) { showError(error); }
    finally { approvalBusy = false; buttons.forEach(item => { item.disabled = false; }); }
  });
}
element('download').addEventListener('click', () => {
  if (selected?.status !== 'approved') return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `agency-zero-${selected.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
});
async function init(): Promise<void> {
  try {
    const config = await api<{ ready: boolean; model: string; loadedAgents: number; registryWarnings: string[] }>('/api/config');
    ready = config.ready;
    element<HTMLButtonElement>('run-agency').disabled = !ready;
    const messages = [...(!ready ? ['OPENAI_API_KEY is not configured. Set it in the server environment and restart Agency OS.'] : []), ...config.registryWarnings];
    element('configuration').hidden = messages.length === 0;
    element('configuration').textContent = messages.join(' ');
    await history();
  } catch (error) { showError(error); }
}
void init();