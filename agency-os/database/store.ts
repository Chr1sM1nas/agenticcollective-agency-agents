import { Pool, type PoolClient } from 'pg';
import type { AgentDefinition, ClientBrief, Evaluation, GenerationResult, Stage, Strategy, TaskPlan, WorkflowStatus } from '../core/contracts.js';
import { DEFAULT_QUALITY_POLICY, LEGACY_QUALITY_POLICY, finalQuality, qualityPolicySchema, type FinalQuality, type QualityPolicy } from '../core/quality.js';

interface FinalArtifact {
  objective: string;
  recommendation: string;
  strategy: Strategy;
  researchArtifactId: string;
  strategyArtifactId: string;
  evaluationId: string;
  finalQuality: FinalQuality;
  unresolvedEvidenceRequirements: string[];
}

interface ReviewedEvaluation {
  id: string;
  strategy_artifact_id: string;
  overall_score: string;
  quality_threshold: string;
  verdict: 'PASS' | 'REVISE';
  iteration: number;
  evaluations: number;
  latest_strategy: number;
}

export class ConflictError extends Error {}
export class Store {
  constructor(readonly pool: Pool) {}

  async transaction<Result>(operation: (client: PoolClient) => Promise<Result>): Promise<Result> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }

  async create(brief: ClientBrief, qualityPolicy: QualityPolicy = DEFAULT_QUALITY_POLICY): Promise<string> {
    const policy = qualityPolicySchema.parse(qualityPolicy);
    return this.transaction(async client => {
      const agency = (await client.query("SELECT a.id, d.id AS deployment_id FROM agencies a JOIN deployments d ON d.agency_id=a.id WHERE a.name='Agentic Collective' AND d.name='Agency Zero'")).rows[0];
      if (!agency) throw new Error('Database is not seeded. Run npm run db:migrate.');
      const customer = (await client.query('INSERT INTO clients(agency_id,name) VALUES ($1,$2) ON CONFLICT(agency_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [agency.id, brief.clientName])).rows[0];
      const project = (await client.query('INSERT INTO projects(client_id,deployment_id,brief) VALUES ($1,$2,$3) RETURNING id', [customer.id, agency.deployment_id, brief])).rows[0];
      const run = (await client.query('INSERT INTO workflow_runs(project_id,quality_policy) VALUES ($1,$2) RETURNING id', [project.id, policy])).rows[0];
      for (const [position, stage] of ['director', 'research', 'strategy', 'critic'].entries()) {
        await client.query('INSERT INTO tasks(workflow_run_id,stage,position) VALUES ($1,$2,$3)', [run.id, stage, position]);
      }
      return run.id;
    });
  }

  async claim(): Promise<{ id: string; brief: ClientBrief; qualityPolicy: QualityPolicy } | null> {
    return this.transaction(async client => {
      const run = (await client.query("SELECT w.id,p.brief,w.quality_policy FROM workflow_runs w JOIN projects p ON p.id=w.project_id WHERE w.status='queued' ORDER BY w.created_at LIMIT 1 FOR UPDATE OF w SKIP LOCKED")).rows[0];
      if (!run) return null;
      const qualityPolicy = qualityPolicySchema.parse(run.quality_policy ?? DEFAULT_QUALITY_POLICY);
      await client.query("UPDATE workflow_runs SET status='running',quality_policy=$2 WHERE id=$1", [run.id, qualityPolicy]);
      return { id: run.id, brief: run.brief, qualityPolicy };
    });
  }

  async beginAgent(runId: string, stage: Stage, agent: AgentDefinition, input: unknown, provider: string, model: string): Promise<{ id: string; attempt: number }> {
    return this.transaction(async client => {
      const task = (await client.query("UPDATE tasks SET status='running',attempt=attempt+1,agent_id=$3 WHERE workflow_run_id=$1 AND stage=$2 RETURNING id,attempt", [runId, stage, agent.id])).rows[0];
      const run = (await client.query('INSERT INTO agent_runs(task_id,attempt,agent_id,agent_name,prompt_hash,prompt_snapshot,input,provider,model) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id', [task.id, task.attempt, agent.id, agent.name, agent.hash, agent.markdown, input, provider, model])).rows[0];
      return { id: run.id, attempt: task.attempt };
    });
  }

  async completeAgent(runId: string, stage: Stage, agentRun: { id: string; attempt: number }, result: GenerationResult, content: unknown): Promise<string> {
    return this.transaction(async client => {
      await client.query("UPDATE agent_runs SET status='complete',finished_at=now(),duration_ms=$2,input_tokens=$3,output_tokens=$4,estimated_cost_usd=$5,provider=$6,model=$7 WHERE id=$1", [agentRun.id, result.durationMs, result.inputTokens, result.outputTokens, result.estimatedCostUsd, result.provider, result.model]);
      const artifact = (await client.query('INSERT INTO artifacts(workflow_run_id,agent_run_id,kind,version,content) VALUES ($1,$2,$3,$4,$5) RETURNING id', [runId, agentRun.id, stage, agentRun.attempt, content])).rows[0];
      await client.query("UPDATE tasks SET status='complete' WHERE workflow_run_id=$1 AND stage=$2", [runId, stage]);
      return artifact.id;
    });
  }

  async failAgent(agentRunId: string, message: string, durationMs: number, result?: GenerationResult): Promise<void> {
    await this.transaction(async client => {
      await client.query("UPDATE agent_runs SET status='failed',finished_at=now(),error=$2,duration_ms=$3,input_tokens=$4,output_tokens=$5,estimated_cost_usd=$6 WHERE id=$1", [agentRunId, message, durationMs, result?.inputTokens ?? null, result?.outputTokens ?? null, result?.estimatedCostUsd ?? null]);
      await client.query("UPDATE tasks SET status='failed' WHERE id=(SELECT task_id FROM agent_runs WHERE id=$1)", [agentRunId]);
    });
  }

  async savePlan(runId: string, plan: TaskPlan): Promise<void> {
    await this.pool.query('UPDATE workflow_runs SET plan=$2 WHERE id=$1', [runId, plan]);
  }

  async saveEvaluation(runId: string, criticArtifact: string, strategyArtifact: string, evaluation: Evaluation): Promise<string> {
    const row = (await this.pool.query('INSERT INTO evaluations(workflow_run_id,critic_artifact_id,strategy_artifact_id,scores,overall_score,verdict,feedback,quality_threshold) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [runId, criticArtifact, strategyArtifact, evaluation.scores, evaluation.overallScore, evaluation.verdict, { weaknesses: evaluation.weaknesses, unsupportedClaims: evaluation.unsupportedClaims, recommendedImprovements: evaluation.recommendedImprovements, unresolvedEvidenceRequirements: evaluation.unresolvedEvidenceRequirements }, evaluation.qualityThreshold])).rows[0];
    return row.id;
  }

  async finish(runId: string, status: WorkflowStatus, error: string | null = null): Promise<void> {
    await this.pool.query('UPDATE workflow_runs SET status=$2,error=$3,finished_at=now() WHERE id=$1', [runId, status, error]);
  }

  private async reviewedEvaluation(client: PoolClient, runId: string, policy: QualityPolicy): Promise<ReviewedEvaluation> {
    const latest = (await client.query<ReviewedEvaluation>(`
      SELECT e.id,e.strategy_artifact_id,e.overall_score,e.quality_threshold,e.verdict,c.version AS iteration,
        (SELECT count(*)::integer FROM evaluations WHERE workflow_run_id=$1) AS evaluations,
        (SELECT max(version) FROM artifacts WHERE workflow_run_id=$1 AND kind='strategy') AS latest_strategy
      FROM evaluations e
      JOIN artifacts c ON c.id=e.critic_artifact_id AND c.workflow_run_id=e.workflow_run_id AND c.kind='critic'
      JOIN artifacts s ON s.id=e.strategy_artifact_id AND s.workflow_run_id=e.workflow_run_id AND s.kind='strategy' AND s.version=c.version
      WHERE e.workflow_run_id=$1 ORDER BY c.version DESC LIMIT 1
    `, [runId])).rows[0];
    if (!latest || latest.iteration !== latest.latest_strategy || latest.iteration !== latest.evaluations ||
      Number(latest.quality_threshold) !== policy.qualityThreshold || latest.iteration > policy.maxCriticIterations ||
      (latest.verdict !== 'PASS' && latest.iteration !== policy.maxCriticIterations)) {
      throw new ConflictError('Final output requires a reviewed latest strategy and a completed quality gate.');
    }
    return latest;
  }

  async assemble(runId: string, content: FinalArtifact): Promise<void> {
    await this.transaction(async client => {
      const run = (await client.query('SELECT status,quality_policy FROM workflow_runs WHERE id=$1 FOR UPDATE', [runId])).rows[0];
      if (run?.status !== 'running') throw new ConflictError('Only an executing workflow can assemble final output.');
      const policy = qualityPolicySchema.parse(run.quality_policy);
      const latest = await this.reviewedEvaluation(client, runId, policy);
      const expectedQuality = finalQuality(Number(latest.overall_score), latest.iteration, policy);
      if (content.evaluationId !== latest.id || content.strategyArtifactId !== latest.strategy_artifact_id ||
        content.finalQuality.finalQualityScore !== expectedQuality.finalQualityScore ||
        content.finalQuality.qualityThreshold !== expectedQuality.qualityThreshold ||
        content.finalQuality.iterations !== expectedQuality.iterations ||
        content.finalQuality.maxCriticIterations !== expectedQuality.maxCriticIterations ||
        content.finalQuality.qualityStatus !== expectedQuality.qualityStatus) {
        throw new ConflictError('Final output must reference the latest evaluation and its quality status.');
      }
      const matches = await client.query("SELECT id FROM artifacts WHERE id=$1 AND workflow_run_id=$2 AND kind='strategy' AND content=$3::jsonb AND content->>'strategicRecommendation'=$4", [content.strategyArtifactId, runId, content.strategy, content.recommendation]);
      const research = await client.query("SELECT id FROM artifacts WHERE id=$1 AND workflow_run_id=$2 AND kind='research'", [content.researchArtifactId, runId]);
      if (!matches.rowCount || !research.rowCount) throw new ConflictError('Final output must preserve the reviewed strategy and original research.');
      await client.query("INSERT INTO artifacts(workflow_run_id,kind,version,content) VALUES ($1,'final',1,$2)", [runId, content]);
      await client.query("UPDATE workflow_runs SET status='awaiting_approval',finished_at=now() WHERE id=$1", [runId]);
    });
  }

  async approve(runId: string, artifactId: string, decision: string, feedback: string): Promise<void> {
    await this.transaction(async client => {
      const run = (await client.query('SELECT status,quality_policy FROM workflow_runs WHERE id=$1 FOR UPDATE', [runId])).rows[0];
      if (run?.status !== 'awaiting_approval') throw new ConflictError('This workflow is not awaiting approval.');
      const artifact = (await client.query("SELECT id,content FROM artifacts WHERE id=$1 AND workflow_run_id=$2 AND kind='final'", [artifactId, runId])).rows[0];
      const policy = run.quality_policy ? qualityPolicySchema.parse(run.quality_policy) : LEGACY_QUALITY_POLICY;
      const evaluation = await this.reviewedEvaluation(client, runId, policy);
      if (!artifact || artifact.content.evaluationId !== evaluation.id || artifact.content.strategyArtifactId !== evaluation.strategy_artifact_id ||
        (!run.quality_policy && evaluation.verdict !== 'PASS')) throw new ConflictError('Approval must reference the reviewed final artifact.');
      await client.query('INSERT INTO approvals(workflow_run_id,artifact_id,evaluation_id,decision,feedback) VALUES ($1,$2,$3,$4,$5)', [runId, artifactId, evaluation.id, decision, feedback]);
      const status = { approve: 'approved', request_changes: 'changes_requested', reject: 'rejected' }[decision];
      if (!status) throw new ConflictError('Invalid approval decision.');
      await client.query('UPDATE workflow_runs SET status=$2 WHERE id=$1', [runId, status]);
    });
  }

  async detail(runId: string) {
    const run = (await this.pool.query('SELECT w.*,p.brief FROM workflow_runs w JOIN projects p ON p.id=w.project_id WHERE w.id=$1', [runId])).rows[0];
    if (!run) return null;
    const [tasks, agents, artifacts, evaluations, approvals] = await Promise.all([
      this.pool.query('SELECT * FROM tasks WHERE workflow_run_id=$1 ORDER BY position', [runId]),
      this.pool.query('SELECT ar.id,ar.agent_id,ar.agent_name,t.stage,ar.attempt,ar.status,ar.provider,ar.model,ar.duration_ms,ar.input_tokens,ar.output_tokens,ar.estimated_cost_usd,ar.error,ar.input,ar.prompt_hash,ar.prompt_snapshot,ar.started_at,ar.finished_at FROM agent_runs ar JOIN tasks t ON t.id=ar.task_id WHERE t.workflow_run_id=$1 ORDER BY ar.started_at,t.position,ar.attempt', [runId]),
      this.pool.query('SELECT * FROM artifacts WHERE workflow_run_id=$1 ORDER BY created_at,kind,version', [runId]),
      this.pool.query('SELECT e.* FROM evaluations e JOIN artifacts c ON c.id=e.critic_artifact_id WHERE e.workflow_run_id=$1 ORDER BY c.version', [runId]),
      this.pool.query('SELECT * FROM approvals WHERE workflow_run_id=$1 ORDER BY created_at', [runId]),
    ]);
    const final = artifacts.rows.find(artifact => artifact.kind === 'final');
    return { ...run, finalQuality: final?.content.finalQuality ?? null, unresolvedEvidenceRequirements: final?.content.unresolvedEvidenceRequirements ?? [], tasks: tasks.rows, agentRuns: agents.rows, artifacts: artifacts.rows, evaluations: evaluations.rows, approvals: approvals.rows };
  }

  async list() {
    return (await this.pool.query('SELECT w.id,w.status,w.created_at,p.brief->>\'clientName\' AS client,p.brief->>\'objective\' AS objective FROM workflow_runs w JOIN projects p ON p.id=w.project_id ORDER BY w.created_at DESC LIMIT 50')).rows;
  }

  async recoverInterrupted(): Promise<void> {
    await this.transaction(async client => {
      await client.query("UPDATE agent_runs SET status='failed',error='Execution interrupted by server restart.',finished_at=now() WHERE status='running'");
      await client.query("UPDATE tasks SET status='failed' WHERE status='running'");
      await client.query("UPDATE workflow_runs SET status='failed',error='Execution interrupted. Submit a new brief to run again.',finished_at=now() WHERE status='running'");
    });
  }
}