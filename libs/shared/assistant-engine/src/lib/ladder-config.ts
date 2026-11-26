import type { ChatModel } from './chat-model';
import { ChatLadder } from './ladder';
import { OpenAiCompatibleModel } from './openai-compatible';
import { type WorkersAiBinding, WorkersAiModel } from './workers-ai';

type Fetch = typeof fetch;

/** What a host passes: keys, a local server, the Workers AI binding. */
export interface LadderEnv {
  readonly GROQ_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
  /** e.g. `http://127.0.0.1:11434`, for development. */
  readonly OLLAMA_URL?: string;
  readonly AI?: WorkersAiBinding;
}

const BASE_URLS = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
} as const;

/**
 * Builds the ladder from a comma-separated list of `provider:model`, with
 * `!read-only` to keep a model away from data, e.g.
 * `groq:openai/gpt-oss-120b,gemini:gemini-flash-latest,workers-ai:@cf/meta/llama-3.3-70b-instruct-fp8-fast!read-only`.
 * A rung whose provider isn't set up (no key) is skipped and listed, so
 * changing model or provider is a change of configuration, not of code.
 */
export function buildLadder(
  spec: string,
  env: LadderEnv,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): { ladder: ChatLadder; skipped: string[] } {
  const models: ChatModel[] = [];
  const skipped: string[] = [];
  for (const entry of spec
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)) {
    const readOnly = entry.endsWith('!read-only');
    const body = readOnly ? entry.slice(0, -'!read-only'.length) : entry;
    const colon = body.indexOf(':');
    const provider = colon < 0 ? body : body.slice(0, colon);
    const model = colon < 0 ? '' : body.slice(colon + 1);
    const capability = readOnly ? 'read-only' : 'tools';
    if (!model) {
      skipped.push(`${entry} (no model)`);
      continue;
    }
    switch (provider) {
      case 'groq':
      case 'gemini': {
        const key = provider === 'groq' ? env.GROQ_API_KEY : env.GEMINI_API_KEY;
        if (!key) {
          skipped.push(`${entry} (no key)`);
          break;
        }
        models.push(
          new OpenAiCompatibleModel({
            label: `${provider === 'groq' ? 'Groq' : 'Gemini'} (${model})`,
            baseUrl: BASE_URLS[provider],
            model,
            apiKey: key,
            fetch: fetchFn,
            capability,
            // gpt-oss reasons before answering: a little is enough here.
            extra: model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {},
          }),
        );
        break;
      }
      case 'ollama':
        if (!env.OLLAMA_URL) {
          skipped.push(`${entry} (no OLLAMA_URL)`);
          break;
        }
        models.push(
          new OpenAiCompatibleModel({
            label: `Ollama (${model})`,
            baseUrl: `${env.OLLAMA_URL.replace(/\/$/, '')}/v1`,
            model,
            apiKey: null,
            fetch: fetchFn,
            capability,
            timeoutMs: 60_000,
          }),
        );
        break;
      case 'workers-ai':
        if (!env.AI) {
          skipped.push(`${entry} (no AI binding)`);
          break;
        }
        models.push(new WorkersAiModel(env.AI, model, capability));
        break;
      default:
        skipped.push(`${entry} (unknown provider)`);
    }
  }
  return { ladder: new ChatLadder(models), skipped };
}
