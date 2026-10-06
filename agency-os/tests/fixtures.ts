import type { GenerationRequest, GenerationResult, ModelProvider, Research, Strategy } from '../core/contracts.js';
import { testBrief } from '../workflows/test-brief.js';

export const fixtureResearch: Research = {
  knownFacts: [{ statement: 'The requested deliverable targets a CEO of a 50-200 person agency.', sourceField: 'requestedDeliverable', sourceQuote: testBrief.requestedDeliverable }],
  assumptions: ['Agency leaders may prefer a bounded pilot to a broad transformation programme; this is an unvalidated hypothesis.'],
  questions: ['Which delivery bottleneck creates the greatest avoidable cost?'],
  marketObservations: ['Model inference: fragmented AI adoption may leave workflow-level inefficiencies unresolved.'],
  competitorConsiderations: ['Consider the internal build alternative and general-purpose AI subscriptions; no competitor research was performed.'],
  opportunities: ['Measure throughput and retained reusable knowledge in a single agency workflow.'],
  risks: ['Weak source quality and staff resistance could reduce pilot value.'],
  recommendedFurtherResearch: ['Interview agency CEOs and baseline cycle time, rework, gross margin and knowledge reuse.'],
};

export const fixtureStrategy: Strategy = {
  situation: 'Client-supplied opportunity: digital agencies face pressure to become AI-native while lacking an operating model.',
  keyInsight: 'Hypothesis: agency CEOs need accountable workflow outcomes rather than more disconnected AI tools.',
  opportunity: 'Position Agency OS as a governed workforce that expands delivery capacity while leaders retain control.',
  strategicRecommendation: 'Agentic Collective helps digital agencies become AI-native without surrendering leadership control: begin with one governed workflow, baseline its economics, and prove faster delivery, reusable knowledge and capacity gains before expanding.',
  proposedApproach: ['Agree one high-volume workflow and a human approval owner.', 'Baseline delivery time, throughput, rework, gross margin and knowledge reuse.', 'Run a bounded pilot and compare results against the baseline before scaling.'],
  expectedBusinessImpact: ['Capacity: compare approved outputs per staff-hour.', 'Speed: compare median brief-to-approval time.', 'Margins: measure labour cost and rework per deliverable; no uplift is guaranteed.', 'Knowledge: measure reuse of approved project context and decisions.'],
  risks: ['Commercial benefits are hypotheses until a pilot validates them.', 'Data governance and adoption must be addressed before client-sensitive work.'],
  nextSteps: ['Invite the CEO to scope a measurable pilot with a clear stop/go decision.'],
  whatChanged: [],
  unresolvedEvidenceRequirements: [],
};

export class FixtureProvider implements ModelProvider {
  readonly name = 'fixture';
  readonly model = 'deterministic-test-only';
  readonly requests: GenerationRequest[] = [];
  private reviews = 0;
  constructor(private readonly mode: 'pass' | 'revise_once' | 'revise_twice' | 'always_revise' | 'evidence' | 'revision_error' | 'critic_error' | 'invalid_selection' | 'invalid_research' | 'false_source' | 'provider_error' = 'pass') {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    this.requests.push(structuredClone(request));
    if (this.mode === 'provider_error') throw new Error('Fixture provider failure.');
    if (this.mode === 'revision_error' && request.stage === 'strategy' && this.reviews === 1) throw new Error('Fixture strategy revision failure.');
    if (this.mode === 'critic_error' && request.stage === 'critic' && this.reviews === 1) throw new Error('Fixture second critic failure.');
    let output: unknown;
    if (request.stage === 'director') output = { objective: testBrief.objective, researchAgentId: this.mode === 'invalid_selection' ? '../../etc/passwd' : 'product/product-trend-researcher.md', strategyAgentId: 'marketing/marketing-growth-hacker.md', researchInstructions: 'Analyse supplied context and label inference.', strategyInstructions: 'Build a CEO-facing go-to-market proposition around measurable business outcomes.', acceptanceCriteria: ['Preserve human control.', 'No unsubstantiated performance guarantees.'] };
    if (request.stage === 'research') output = this.mode === 'invalid_research' ? { invalid: true } : this.mode === 'false_source' ? { ...fixtureResearch, knownFacts: [{ ...fixtureResearch.knownFacts[0], sourceQuote: 'fabricated quotation' }] } : fixtureResearch;
    if (request.stage === 'strategy') output = { ...fixtureStrategy, whatChanged: this.reviews ? ['Softened unsupported uplift language; retained validation needs.'] : [] };
    if (request.stage === 'critic') {
      this.reviews += 1;
      const revise = this.mode === 'always_revise' || ((this.mode === 'revise_once' || this.mode === 'evidence' || this.mode === 'revision_error' || this.mode === 'critic_error') && this.reviews === 1) || (this.mode === 'revise_twice' && this.reviews < 3);
      output = {
        scores: revise ? { relevance: 8, evidence: 7, strategicQuality: 8, originality: 8, commercialValue: 8, clarity: 8 } : { relevance: 9, evidence: 8, strategicQuality: 9, originality: 8, commercialValue: 9, clarity: 9 },
        weaknesses: revise ? ['Improve the measurable pilot framing.'] : [],
        unsupportedClaims: this.mode === 'evidence' && this.reviews === 1 ? ['Margin improvement has not been validated.'] : [],
        recommendedImprovements: revise ? ['Use baseline comparisons rather than promised uplifts.'] : [],
        unresolvedEvidenceRequirements: this.mode === 'evidence' && this.reviews === 1 ? ['Pilot evidence demonstrating delivery acceleration.'] : [],
      };
    }
    return { output: structuredClone(output), provider: this.name, model: this.model, inputTokens: null, outputTokens: null, estimatedCostUsd: null, durationMs: 1 };
  }
}