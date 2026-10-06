import OpenAI from 'openai';
import { GenerationError, type GenerationRequest, type GenerationResult, type ModelProvider } from '../core/contracts.js';

export function estimateCost(inputTokens: number | null, outputTokens: number | null, inputPrice?: number, outputPrice?: number): number | null {
  if (inputTokens === null || outputTokens === null || inputPrice === undefined || outputPrice === undefined) return null;
  return (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000;
}

export class OpenAIProvider implements ModelProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;
  constructor(readonly model: string, apiKey: string, private readonly options: { inputPrice?: number; outputPrice?: number; maxOutputTokens: number; maxInputChars: number; fetch?: typeof fetch }) {
    this.client = new OpenAI({ apiKey, maxRetries: 0, timeout: 120000, fetch: options.fetch });
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const started = Date.now();
    const input = JSON.stringify(request.input);
    const system = `${request.system}\nReturn ONLY a JSON object matching this field specification: ${JSON.stringify(request.outputShape)}. No Markdown fences. All fields are required.`;
    if (input.length + system.length > this.options.maxInputChars) throw new Error('Complete context exceeds MAX_INPUT_CHARS. Increase the limit with a suitable model; no input was truncated.');
    let completion;
    try {
      completion = await this.client.chat.completions.create({ model: this.model, messages: [{ role: 'system', content: system }, { role: 'user', content: input }], response_format: { type: 'json_object' }, max_completion_tokens: this.options.maxOutputTokens });
    } catch (error) {
      if (error instanceof OpenAI.APIError) throw new Error(`OpenAI request failed (HTTP ${error.status ?? 'unavailable'}). Check credentials, model access, quota and provider availability.`);
      throw new Error('OpenAI request failed or timed out. Check network connectivity and retry with a new brief.');
    }
    const choice = completion.choices[0];
    const inputTokens = completion.usage?.prompt_tokens ?? null;
    const outputTokens = completion.usage?.completion_tokens ?? null;
    const metrics: GenerationResult = { output: null, provider: this.name, model: completion.model, inputTokens, outputTokens, estimatedCostUsd: estimateCost(inputTokens, outputTokens, this.options.inputPrice, this.options.outputPrice), durationMs: Date.now() - started };
    if (choice?.finish_reason !== 'stop' || !choice.message.content) throw new GenerationError('OpenAI did not return a complete JSON response. Check output token limit or model compatibility.', metrics);
    let output: unknown;
    try { output = JSON.parse(choice.message.content); }
    catch { throw new GenerationError('OpenAI returned invalid JSON. Workflow stopped without delivering unvalidated output.', metrics); }
    return { ...metrics, output };
  }
}