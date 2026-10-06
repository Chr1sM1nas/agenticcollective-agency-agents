import { z } from 'zod';

export const QUALITY_THRESHOLD = 8.5;
export const MAX_CRITIC_ITERATIONS = 3;
export const qualityPolicySchema = z.object({
  qualityThreshold: z.number().finite().min(0).max(10),
  maxCriticIterations: z.number().int().min(1).max(MAX_CRITIC_ITERATIONS),
}).strict();
export type QualityPolicy = z.infer<typeof qualityPolicySchema>;
export const DEFAULT_QUALITY_POLICY: QualityPolicy = { qualityThreshold: QUALITY_THRESHOLD, maxCriticIterations: MAX_CRITIC_ITERATIONS };
export const QUALITY_REACHED = 'QUALITY THRESHOLD REACHED';
export const QUALITY_EXHAUSTED = 'MAX ITERATIONS REACHED - HUMAN REVIEW REQUIRED';
export const LEGACY_QUALITY_POLICY: QualityPolicy = { qualityThreshold: 7.5, maxCriticIterations: 2 };

export interface FinalQuality {
  finalQualityScore: number;
  qualityThreshold: number;
  iterations: number;
  maxCriticIterations: number;
  qualityStatus: typeof QUALITY_REACHED | typeof QUALITY_EXHAUSTED;
}

export function configuredQualityPolicy(env: NodeJS.ProcessEnv): QualityPolicy {
  const setting = z.string().trim().min(1).transform(Number);
  return qualityPolicySchema.parse({
    qualityThreshold: env.QUALITY_THRESHOLD === undefined ? QUALITY_THRESHOLD : setting.parse(env.QUALITY_THRESHOLD),
    maxCriticIterations: env.MAX_CRITIC_ITERATIONS === undefined ? MAX_CRITIC_ITERATIONS : setting.parse(env.MAX_CRITIC_ITERATIONS),
  });
}

export function finalQuality(score: number, iterations: number, policy: QualityPolicy): FinalQuality {
  return {
    finalQualityScore: score,
    qualityThreshold: policy.qualityThreshold,
    iterations,
    maxCriticIterations: policy.maxCriticIterations,
    qualityStatus: score >= policy.qualityThreshold ? QUALITY_REACHED : QUALITY_EXHAUSTED,
  };
}
