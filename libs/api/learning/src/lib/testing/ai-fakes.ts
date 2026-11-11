import {
  type AudioClip,
  type Decision,
  type DecisionModel,
  type GenerativeModel,
  type ModelCall,
  ModelLadder,
  type ModelReply,
  type Transcriber,
} from '@ah/api/ai';
import type { PipelineAi } from '../capture-pipeline';

/**
 * A model that answers each call from a script keyed by the call's name
 * (`extract_concepts`, `explain_concept`, …), in order. An `Error` in the
 * script is thrown, the way a provider fails.
 */
export class ScriptedModel implements GenerativeModel {
  readonly label = 'Scripted model';
  readonly calls: ModelCall[] = [];

  constructor(private readonly script: Record<string, unknown[]> = {}) {}

  add(name: string, ...replies: unknown[]): this {
    (this.script[name] ??= []).push(...replies);
    return this;
  }

  async generate(call: ModelCall): Promise<ModelReply> {
    this.calls.push(call);
    const next = this.script[call.name]?.shift();
    if (next === undefined)
      throw new Error(`No scripted reply for ${call.name}`);
    if (next instanceof Error) throw next;
    return { text: JSON.stringify(next), provider: this.label };
  }
}

export class FakeDecisions implements DecisionModel {
  readonly label = 'Fake decisions';
  readonly asked: Record<string, unknown>[] = [];
  /** Answers by question key; a missing key gets an unsure 0.5. */
  answers: Record<string, Decision['answers'][string]> = {};
  failing = false;

  async decide(
    _state: unknown,
    questions: Record<string, unknown>,
  ): Promise<Decision> {
    this.asked.push(questions);
    if (this.failing) throw new Error('Jev is down');
    const answers: Decision['answers'] = {};
    for (const key of Object.keys(questions)) {
      answers[key] = this.answers[key] ?? { type: 'noul', p: 0.5 };
    }
    return { answers, provider: this.label, calibrated: true };
  }
}

export class FakeTranscriber implements Transcriber {
  readonly label = 'Fake transcriber';
  readonly heard: AudioClip[] = [];

  constructor(
    private readonly text = 'Spaced repetition means reviewing just before you forget.',
    readonly configured = true,
  ) {}

  async transcribe(clip: AudioClip): Promise<string> {
    this.heard.push(clip);
    return this.text;
  }
}

export function fakeAi(
  model = new ScriptedModel(),
  decisions = new FakeDecisions(),
  transcriber = new FakeTranscriber(),
): PipelineAi & {
  model: ScriptedModel;
  decisions: FakeDecisions;
  transcriber: FakeTranscriber;
} {
  return {
    model,
    ladder: new ModelLadder([model], 0),
    decisions,
    transcriber,
  };
}
