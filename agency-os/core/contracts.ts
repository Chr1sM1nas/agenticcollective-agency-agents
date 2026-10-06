import { z } from 'zod';
import { QUALITY_THRESHOLD } from './quality.js';

const text = z.string().trim().min(1).max(16000);
export const briefSchema = z.object({
  clientName: text.max(200),
  objective: text,
  problemOpportunity: text,
  requestedDeliverable: text,
  context: text,
}).strict();
export type ClientBrief = z.infer<typeof briefSchema>;

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  markdown: string;
  hash: string;
}

export const planSchema = z.object({
  objective: text,
  researchAgentId: text,
  strategyAgentId: text,
  researchInstructions: text,
  strategyInstructions: text,
  acceptanceCriteria: z.array(text).min(1).max(12),
}).strict();
export type TaskPlan = z.infer<typeof planSchema>;

const items = z.array(text).max(30);
export const researchSchema = z.object({
  knownFacts: z.array(z.object({ statement: text, sourceField: z.enum(['clientName', 'objective', 'problemOpportunity', 'requestedDeliverable', 'context']), sourceQuote: text }).strict()).max(30),
  assumptions: items,
  questions: items,
  marketObservations: items,
  competitorConsiderations: items,
  opportunities: items,
  risks: items,
  recommendedFurtherResearch: items,
}).strict();
export type Research = z.infer<typeof researchSchema>;

export const strategySchema = z.object({
  situation: text,
  keyInsight: text,
  opportunity: text,
  strategicRecommendation: text,
  proposedApproach: items.min(1),
  expectedBusinessImpact: items.min(1),
  risks: items,
  nextSteps: items.min(1),
  whatChanged: items.default([]),
  unresolvedEvidenceRequirements: items.default([]),
}).strict();
export type Strategy = z.infer<typeof strategySchema>;

const score = z.number().min(0).max(10);
export const criticSchema = z.object({
  scores: z.object({ relevance: score, evidence: score, strategicQuality: score, originality: score, commercialValue: score, clarity: score }).strict(),
  weaknesses: items,
  unsupportedClaims: items,
  recommendedImprovements: items,
  unresolvedEvidenceRequirements: items.default([]),
}).strict();
export type CriticResponse = z.infer<typeof criticSchema>;
export interface Evaluation extends CriticResponse {
  overallScore: number;
  verdict: 'PASS' | 'REVISE';
  qualityThreshold: number;
}
export function evaluate(response: CriticResponse, qualityThreshold = QUALITY_THRESHOLD): Evaluation {
  const overallScore = Object.values(response.scores).reduce((sum, value) => sum + value, 0) / 6;
  return { ...response, overallScore, qualityThreshold, verdict: overallScore >= qualityThreshold ? 'PASS' : 'REVISE' };
}

export type Stage = 'director' | 'research' | 'strategy' | 'critic';
export type WorkflowStatus = 'queued' | 'running' | 'awaiting_approval' | 'approved' | 'changes_requested' | 'rejected' | 'needs_review' | 'failed';
export const approvalSchema = z.object({
  decision: z.enum(['approve', 'request_changes', 'reject']),
  feedback: z.string().trim().max(16000).default(''),
  artifactId: z.string().uuid(),
}).strict().refine(value => value.decision !== 'request_changes' || value.feedback.length > 0, { message: 'Describe the requested changes.', path: ['feedback'] });

export interface GenerationRequest {
  stage: Stage;
  system: string;
  input: unknown;
  outputShape: unknown;
}
export interface GenerationResult {
  output: unknown;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  durationMs: number;
}
export class GenerationError extends Error {
  constructor(message: string, readonly result: GenerationResult) { super(message); }
}
export interface ModelProvider {
  readonly name: string;
  readonly model: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}