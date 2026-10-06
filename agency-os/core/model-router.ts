import { z } from 'zod';
import { OpenAIProvider } from '../runtime/openai.js';
import type { ModelProvider } from './contracts.js';

export const DEFAULT_MODEL = 'gpt-4.1-mini';
const optionalPrice = z.preprocess(value => value === '' ? undefined : value, z.coerce.number().finite().nonnegative().optional());
const configSchema = z.object({
  OPENAI_MODEL: z.string().min(1).default(DEFAULT_MODEL),
  OPENAI_INPUT_USD_PER_MILLION: optionalPrice,
  OPENAI_OUTPUT_USD_PER_MILLION: optionalPrice,
  MAX_OUTPUT_TOKENS: z.coerce.number().int().min(1000).max(32000).default(6000),
  MAX_INPUT_CHARS: z.coerce.number().int().min(10000).max(1000000).default(200000),
});

export class ModelRouter {
  constructor(private readonly defaultProvider: ModelProvider) {}
  forTask(): ModelProvider { return this.defaultProvider; }
}

export function configuredRouter(env: NodeJS.ProcessEnv): ModelRouter | null {
  if (!env.OPENAI_API_KEY) return null;
  const config = configSchema.parse(env);
  return new ModelRouter(new OpenAIProvider(config.OPENAI_MODEL, env.OPENAI_API_KEY, { inputPrice: config.OPENAI_INPUT_USD_PER_MILLION, outputPrice: config.OPENAI_OUTPUT_USD_PER_MILLION, maxOutputTokens: config.MAX_OUTPUT_TOKENS, maxInputChars: config.MAX_INPUT_CHARS }));
}