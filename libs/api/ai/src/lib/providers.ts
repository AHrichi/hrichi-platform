import {
  FallbackDecisionModel,
  JevDecisionModel,
  LadderDecisionModel,
  type DecisionModel,
} from './decision';
import { ModelLadder } from './ladder';
import { GeminiModel, type GenerativeModel, GroqChatModel } from './models';
import { N8nRelay, type N8nRelayOptions } from './n8n-relay';
import {
  FallbackTranscriber,
  GeminiTranscriber,
  GroqWhisperTranscriber,
} from './transcriber';

/** API keys for the model providers; each one is optional. */
export interface AiKeys {
  groq: string | null;
  gemini: string | null;
  /** TypeSafe (Jev). Unset, decisions go to the generative ladder. */
  typesafe: string | null;
  /**
   * The n8n relay: Groq and Gemini through the keys n8n holds, for a
   * provider whose key isn't set here. Captures wait while n8n is off.
   */
  n8n?: N8nRelayOptions | null;
}

/** The models, as StudyLM's workflow orders them (docs/studylm/ai-workflow.md). */
export const MODELS = {
  big: 'openai/gpt-oss-120b',
  small: 'openai/gpt-oss-20b',
  qwen: 'qwen/qwen3.8-27b',
  gemini: 'gemini-flash-latest',
  geminiLite: 'gemini-3.5-flash-lite',
} as const;

export interface AiProviders {
  ladder: ModelLadder;
  transcriber: FallbackTranscriber;
  decisions: DecisionModel;
  /** For logs and the health of the pipeline: which providers are set up. */
  summary: string;
  /**
   * Whether the models can be reached now: always with a key here; through
   * the relay only while n8n answers.
   */
  reachable: () => Promise<boolean>;
}

type Fetch = typeof fetch;

export function buildAiProviders(
  keys: AiKeys,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): AiProviders {
  const relay = keys.n8n ? new N8nRelay(keys.n8n, fetchFn) : null;
  // A key here wins; without one, the provider goes through n8n's key.
  const groq = keys.groq
    ? { key: keys.groq, fetch: fetchFn }
    : relay
      ? { key: 'held-by-n8n', fetch: relay.fetch }
      : null;
  const gemini = keys.gemini
    ? { key: keys.gemini, fetch: fetchFn }
    : relay
      ? { key: 'held-by-n8n', fetch: relay.fetch }
      : null;
  const generative: GenerativeModel[] = [];
  if (groq) {
    generative.push(
      new GroqChatModel(MODELS.big, groq.key, groq.fetch),
      new GroqChatModel(MODELS.small, groq.key, groq.fetch),
      new GroqChatModel(MODELS.qwen, groq.key, groq.fetch),
    );
  }
  if (gemini) {
    generative.push(
      new GeminiModel(MODELS.gemini, gemini.key, gemini.fetch),
      new GeminiModel(MODELS.geminiLite, gemini.key, gemini.fetch),
    );
  }
  const ladder = new ModelLadder(generative);
  // Whisper takes multipart, which the relay doesn't carry: through n8n,
  // Gemini transcribes (a JSON call).
  const transcriber = new FallbackTranscriber([
    ...(keys.groq
      ? [new GroqWhisperTranscriber(keys.groq, undefined, fetchFn)]
      : []),
    // Flash-Lite after Flash, which is often busy.
    ...(gemini
      ? [
          new GeminiTranscriber(gemini.key, MODELS.gemini, gemini.fetch),
          new GeminiTranscriber(gemini.key, MODELS.geminiLite, gemini.fetch),
        ]
      : []),
  ]);
  const decisions = new FallbackDecisionModel([
    ...(keys.typesafe
      ? [new JevDecisionModel(keys.typesafe, undefined, fetchFn)]
      : []),
    new LadderDecisionModel(ladder),
  ]);
  const summary = [
    keys.groq ? 'Groq' : relay ? 'Groq through n8n' : null,
    keys.gemini ? 'Gemini' : relay ? 'Gemini through n8n' : null,
    keys.typesafe ? 'Jev' : null,
  ]
    .filter(Boolean)
    .join(', ');
  const direct = !!(keys.groq || keys.gemini);
  return {
    ladder,
    transcriber,
    decisions,
    summary: summary || 'none',
    reachable: async () => direct || (relay ? relay.reachable() : false),
  };
}
