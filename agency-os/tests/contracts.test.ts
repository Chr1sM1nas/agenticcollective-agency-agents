import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { AgentRegistry } from '../core/registry.js';
import { approvalSchema, evaluate, strategySchema } from '../core/contracts.js';
import { configuredQualityPolicy, DEFAULT_QUALITY_POLICY, finalQuality, QUALITY_EXHAUSTED, QUALITY_REACHED } from '../core/quality.js';
import { fixtureStrategy } from './fixtures.js';

test('registry reads live definitions and validates specialist selection', async () => {
  const registry = await AgentRegistry.load(path.resolve('..'));
  const researcher = registry.select('product/product-trend-researcher.md', 'research');
  assert.equal(researcher.name, 'Trend Researcher');
  assert.ok(researcher.markdown.includes('Market Research'));
  assert.equal(researcher.hash.length, 64);
  assert.ok(registry.candidates('strategy').some(agent => agent.name === 'Growth Hacker'));
  assert.throws(() => registry.select('../../etc/passwd', 'strategy'));
});

test('QA threshold is computed from six scores without rounding into PASS', () => {
  const response = { scores: { relevance: 8.5, evidence: 8.5, strategicQuality: 8.5, originality: 8.5, commercialValue: 8.5, clarity: 8.5 }, weaknesses: [], unsupportedClaims: [], recommendedImprovements: [], unresolvedEvidenceRequirements: [] };
  assert.equal(evaluate(response).verdict, 'PASS');
  assert.equal(evaluate({ ...response, scores: { ...response.scores, evidence: 8.499 } }).verdict, 'REVISE');
  const previousPass = { relevance: 8, evidence: 7, strategicQuality: 8, originality: 8, commercialValue: 8, clarity: 8 };
  assert.equal(evaluate({ ...response, scores: previousPass }).verdict, 'REVISE');
  assert.equal(evaluate({ ...response, scores: previousPass }, 7.5).verdict, 'PASS');
});

test('quality policy defaults, configuration and final status are explicit', () => {
  assert.deepEqual(configuredQualityPolicy({}), DEFAULT_QUALITY_POLICY);
  assert.deepEqual(configuredQualityPolicy({ QUALITY_THRESHOLD: '9', MAX_CRITIC_ITERATIONS: '2' }), { qualityThreshold: 9, maxCriticIterations: 2 });
  for (const env of [{ QUALITY_THRESHOLD: '11' }, { QUALITY_THRESHOLD: '' }, { QUALITY_THRESHOLD: 'invalid' }, { MAX_CRITIC_ITERATIONS: '4' }, { MAX_CRITIC_ITERATIONS: '0' }]) assert.throws(() => configuredQualityPolicy(env));
  assert.equal(finalQuality(8.5, 1, DEFAULT_QUALITY_POLICY).qualityStatus, QUALITY_REACHED);
  assert.equal(finalQuality(7.83, 3, DEFAULT_QUALITY_POLICY).qualityStatus, QUALITY_EXHAUSTED);
});

test('human change requests require feedback and a specific artifact', () => {
  assert.equal(approvalSchema.safeParse({ decision: 'request_changes', feedback: '', artifactId: '00000000-0000-4000-8000-000000000000' }).success, false);
});

test('strategy change notes are structured arrays, not empty prose or null', () => {
  assert.equal(strategySchema.safeParse({ ...fixtureStrategy, whatChanged: [] }).success, true);
  for (const whatChanged of ['', null, 'Initial version', ['']]) {
    assert.equal(strategySchema.safeParse({ ...fixtureStrategy, whatChanged }).success, false);
  }
});