import { conforms, parseReply, tidy } from '@ah/shared/ai-schema';
import { type GenerativeModel, type ModelCall, ModelCallError } from './models';

export interface LadderResult {
  data: unknown;
  provider: string;
}

export interface AttemptLog {
  provider: string;
  outcome: 'http-error' | 'unparsable' | 'schema-mismatch';
  detail: string;
}

/**
 * Every model failed or answered with JSON that doesn't fit. Callers mark
 * the work failed and retry later: nothing is ever filled in (ADR-0021).
 */
export class LadderExhaustedError extends Error {
  override readonly name = 'LadderExhaustedError';

  constructor(readonly attempts: AttemptLog[]) {
    super(
      attempts.length
        ? `Every model failed: ${attempts.map((a) => `${a.provider} ${a.outcome}`).join('; ')}`
        : 'No AI model is configured.',
    );
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Climbs the models in order until one answers with JSON that fits the
 * schema, the way StudyLM's n8n workflow does (docs/studylm/ai-workflow.md):
 * a reply is parsed, near-misses are tidied, and a refused Groq reply is
 * salvaged when what it generated fits. Gemini's "high demand" errors pass
 * in seconds, so a Gemini model gets one retry after `retryDelayMs`.
 */
export class ModelLadder {
  constructor(
    private readonly models: readonly GenerativeModel[],
    private readonly retryDelayMs = 3000,
  ) {}

  get configured(): boolean {
    return this.models.length > 0;
  }

  async run(call: ModelCall): Promise<LadderResult> {
    const attempts: AttemptLog[] = [];
    for (const model of this.models) {
      const tries = model.label.startsWith('Gemini') ? 2 : 1;
      for (let attempt = 0; attempt < tries; attempt++) {
        let text: string;
        try {
          text = (await model.generate(call)).text;
        } catch (error) {
          const salvage =
            error instanceof ModelCallError ? error.salvage : null;
          if (!salvage) {
            attempts.push({
              provider: model.label,
              outcome: 'http-error',
              detail: error instanceof Error ? error.message : String(error),
            });
            if (attempt + 1 < tries) await sleep(this.retryDelayMs);
            continue;
          }
          text = salvage;
        }
        const parsed = parseReply(text);
        if (parsed === null) {
          attempts.push({
            provider: model.label,
            outcome: 'unparsable',
            detail: text.slice(0, 200),
          });
          break;
        }
        const tidied = tidy(parsed, call.schema);
        if (conforms(tidied, call.schema)) {
          return { data: tidied, provider: model.label };
        }
        attempts.push({
          provider: model.label,
          outcome: 'schema-mismatch',
          detail: JSON.stringify(parsed).slice(0, 200),
        });
        break;
      }
    }
    throw new LadderExhaustedError(attempts);
  }
}
