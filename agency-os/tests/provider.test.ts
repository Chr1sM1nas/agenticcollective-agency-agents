import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateCost, OpenAIProvider } from '../runtime/openai.js';
import { configuredRouter } from '../core/model-router.js';
import { GenerationError } from '../core/contracts.js';

const options = { maxOutputTokens: 6000, maxInputChars: 200000 };
const request = { stage: 'director' as const, system: 'Director instructions', input: { full: 'unabridged input' }, outputShape: { field: 'string' } };

test('OpenAI adapter sends configured model, complete context and captures usage', async () => {
  let sent: Record<string, unknown> | undefined;
  const transport: typeof fetch = async (_url, init) => {
    sent = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ id: 'mock-completion', object: 'chat.completion', created: 0, model: 'configured-model-snapshot', choices: [{ index: 0, message: { role: 'assistant', content: '{"field":"result"}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 } }), { headers: { 'content-type': 'application/json' } });
  };
  const provider = new OpenAIProvider('configured-model', 'test-placeholder-not-a-real-key', { ...options, inputPrice: 1, outputPrice: 2, fetch: transport });
  const result = await provider.generate(request);
  assert.equal(sent?.model, 'configured-model');
  assert.equal((sent?.messages as { content: string }[])[1].content, JSON.stringify(request.input));
  assert.deepEqual(result.output, { field: 'result' });
  assert.equal(result.model, 'configured-model-snapshot');
  assert.equal(result.inputTokens, 1000);
  assert.equal(result.outputTokens, 500);
  assert.equal(result.estimatedCostUsd, 0.002);
});

test('unknown pricing is not recorded as a zero cost', () => {
  assert.equal(estimateCost(1000, 500), null);
  assert.equal(estimateCost(null, 500, 1, 2), null);
  assert.equal(configuredRouter({}), null);
});

test('provider errors are sanitized and are not retried automatically', async () => {
  let calls = 0;
  const provider = new OpenAIProvider('configured-model', 'test-placeholder-not-a-real-key', { ...options, fetch: async () => { calls += 1; return new Response(JSON.stringify({ error: { message: 'Sensitive upstream error text', type: 'invalid_request_error' } }), { status: 401, headers: { 'content-type': 'application/json' } }); } });
  await assert.rejects(provider.generate(request), error => error instanceof Error && error.message.includes('401') && !error.message.includes('Sensitive'));
  assert.equal(calls, 1);
});

test('oversized complete handoff stops before making a provider request', async () => {
  let calls = 0;
  const provider = new OpenAIProvider('configured-model', 'test-placeholder-not-a-real-key', { ...options, maxInputChars: 10, fetch: async () => { calls += 1; throw new Error('Not expected'); } });
  await assert.rejects(provider.generate(request), /no input was truncated/);
  assert.equal(calls, 0);
});

test('incomplete model responses cannot become valid artifacts', async () => {
  const provider = new OpenAIProvider('configured-model', 'test-placeholder-not-a-real-key', { ...options, fetch: async () => new Response(JSON.stringify({ model: 'configured-model', choices: [{ message: { content: '{"field":"partial"}' }, finish_reason: 'length' }], usage: { prompt_tokens: 100, completion_tokens: 200 } }), { headers: { 'content-type': 'application/json' } }) });
  await assert.rejects(provider.generate(request), error => error instanceof GenerationError && error.message.includes('complete JSON response') && error.result.inputTokens === 100 && error.result.outputTokens === 200);
});