import {
  FallbackDecisionModel,
  JevDecisionModel,
  LadderDecisionModel,
  type DecisionModel,
} from './decision';
import { ModelLadder } from './ladder';
import { GeminiModel, type GenerativeModel, GroqChatModel } from './models';
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
}

type Fetch = typeof fetch;

export function buildAiProviders(
  keys: AiKeys,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): AiProviders {
  const generative: GenerativeModel[] = [];
  if (keys.groq) {
    generative.push(
      new GroqChatModel(MODELS.big, keys.groq, fetchFn),
      new GroqChatModel(MODELS.small, keys.groq, fetchFn),
      new GroqChatModel(MODELS.qwen, keys.groq, fetchFn),
    );
  }
  if (keys.gemini) {
    generative.push(
      new GeminiModel(MODELS.gemini, keys.gemini, fetchFn),
      new GeminiModel(MODELS.geminiLite, keys.gemini, fetchFn),
    );
  }
  const ladder = new ModelLadder(generative);
  const transcriber = new FallbackTranscriber([
    ...(keys.groq
      ? [new GroqWhisperTranscriber(keys.groq, undefined, fetchFn)]
      : []),
    ...(keys.gemini
      ? [new GeminiTranscriber(keys.gemini, undefined, fetchFn)]
      : []),
  ]);
  const decisions = new FallbackDecisionModel([
    ...(keys.typesafe
      ? [new JevDecisionModel(keys.typesafe, undefined, fetchFn)]
      : []),
    new LadderDecisionModel(ladder),
  ]);
  const summary = [
    keys.groq ? 'Groq' : null,
    keys.gemini ? 'Gemini' : null,
    keys.typesafe ? 'Jev' : null,
  ]
    .filter(Boolean)
    .join(', ');
  return { ladder, transcriber, decisions, summary: summary || 'none' };
}
