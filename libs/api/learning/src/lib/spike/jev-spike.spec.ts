import { mkdirSync, writeFileSync } from 'node:fs';
import {
  buildAiProviders,
  type DecisionModel,
  JevDecisionModel,
  LadderDecisionModel,
} from '@ah/api/ai';
import {
  type ExplainedConcept,
  gateQuestions,
  gateState,
  GOLDEN_CONCEPTS,
  gradeQuestions,
  gradeState,
  NOT_STATED,
  readGate,
  readGrade,
  type RecallPrompt,
  STATED,
  type Verdict,
} from '@ah/learning/domain';
import { GATE_MUTATIONS } from './broken-explanations';
import { LABELLED_ANSWERS, OFF_TOPIC } from './labelled-answers';

/**
 * The Jev spike (design §6.4). The dataset checks always run. The
 * measurement calls real models, so it runs only on request:
 *
 *   LEARNING_JEV_SPIKE=1 TYPESAFE_API_KEY=… [GROQ_API_KEY=…] [GEMINI_API_KEY=…] \
 *     pnpm nx test api-learning -- jev-spike
 *
 * It writes tmp/jev-spike/report.json and prints the go/no-go per task.
 */

const golden = (title: string) => {
  const found = GOLDEN_CONCEPTS.find((concept) => concept.title === title);
  if (!found) throw new Error(`No golden concept "${title}"`);
  return found;
};

function promptOf(title: string, index: number): RecallPrompt {
  const prompt = golden(title).explained.prompts[index];
  return { id: crypto.randomUUID(), retired: false, ...prompt };
}

function verdictOf(covers: boolean[]): Verdict {
  if (covers.every(Boolean)) return 'nailed';
  return covers.some(Boolean) ? 'close' : 'missed';
}

/** Every labelled answer, plus one off-topic reply per graded prompt. */
function gradingCases() {
  const cases = LABELLED_ANSWERS.map((item) => ({ ...item }));
  const prompts = new Map<string, { concept: string; prompt: number }>();
  for (const item of LABELLED_ANSWERS) {
    prompts.set(`${item.concept}#${item.prompt}`, item);
  }
  [...prompts.values()].forEach((item, i) => {
    const keyPoints = golden(item.concept).explained.prompts[item.prompt]
      .keyPoints;
    cases.push({
      concept: item.concept,
      prompt: item.prompt,
      answer: OFF_TOPIC[i % OFF_TOPIC.length],
      covers: keyPoints.map(() => false),
    });
  });
  return cases;
}

interface GateCase {
  concept: string;
  variant: 'clean' | 'false-claim' | 'not-a-mistake' | 'leaky';
  span: string;
  explained: ExplainedConcept;
  /** Prompt index whose question gives its answer away. */
  leak: number | null;
}

function gateCases(): GateCase[] {
  return GATE_MUTATIONS.flatMap((mutation) => {
    const { span, explained } = golden(mutation.concept);
    const leakAt = explained.prompts.findIndex((p) => p.type !== 'quick_fire');
    const leaky = {
      ...explained,
      prompts: explained.prompts.map((prompt, i) =>
        i === leakAt
          ? {
              ...prompt,
              question: `${prompt.question} (Hint: ${prompt.answer})`,
            }
          : prompt,
      ),
    };
    return [
      {
        concept: mutation.concept,
        variant: 'clean' as const,
        span,
        explained,
        leak: null,
      },
      {
        concept: mutation.concept,
        variant: 'false-claim' as const,
        span,
        explained: {
          ...explained,
          simple: `${explained.simple} ${mutation.falseClaim}`,
        },
        leak: null,
      },
      {
        concept: mutation.concept,
        variant: 'not-a-mistake' as const,
        span,
        explained: { ...explained, misconception: mutation.notAMistake },
        leak: null,
      },
      {
        concept: mutation.concept,
        variant: 'leaky' as const,
        span,
        explained: leaky,
        leak: leakAt,
      },
    ];
  });
}

describe('Jev spike dataset', () => {
  it('labels every key point of real golden prompts', () => {
    for (const item of LABELLED_ANSWERS) {
      const prompt = golden(item.concept).explained.prompts[item.prompt];
      expect(prompt, `${item.concept} #${item.prompt}`).toBeDefined();
      expect(
        item.covers,
        `${item.concept} #${item.prompt}: "${item.answer}"`,
      ).toHaveLength(prompt.keyPoints.length);
    }
  });

  it('is big and balanced enough to measure', () => {
    const cases = gradingCases();
    expect(cases.length).toBeGreaterThanOrEqual(110);
    const verdicts = cases.map((item) => verdictOf(item.covers));
    for (const verdict of ['nailed', 'close', 'missed'] as const) {
      expect(
        verdicts.filter((v) => v === verdict).length,
      ).toBeGreaterThanOrEqual(20);
    }
    expect(gateCases()).toHaveLength(GOLDEN_CONCEPTS.length * 4);
  });
});

const spike =
  process.env['LEARNING_JEV_SPIKE'] === '1' &&
  !!process.env['TYPESAFE_API_KEY'];

describe.skipIf(!spike)('Jev spike measurement (real models)', () => {
  const env = (name: string) => process.env[name]?.trim() || null;
  const models: { name: string; model: DecisionModel }[] = [
    { name: 'jev', model: new JevDecisionModel(env('TYPESAFE_API_KEY') ?? '') },
  ];
  const providers = buildAiProviders({
    groq: env('GROQ_API_KEY'),
    gemini: env('GEMINI_API_KEY'),
    typesafe: null,
  });
  if (providers.ladder.configured) {
    models.push({
      name: 'ladder',
      model: new LadderDecisionModel(providers.ladder),
    });
  }

  it(
    'measures grading and the quality gate',
    { timeout: 60 * 60_000 },
    async () => {
      const report: Record<string, unknown> = { at: new Date().toISOString() };
      for (const { name, model } of models) {
        const grading = {
          points: 0,
          pointsRight: 0,
          verdicts: 0,
          agree: 0,
          falseNailed: 0,
          notNailed: 0,
          unsure: 0,
          errors: 0,
        };
        const latencies: number[] = [];
        for (const item of gradingCases()) {
          const prompt = promptOf(item.concept, item.prompt);
          const started = performance.now();
          try {
            const decision = await model.decide(
              gradeState(prompt, item.answer),
              gradeQuestions(prompt),
            );
            latencies.push(performance.now() - started);
            item.covers.forEach((covered, i) => {
              const answer = decision.answers[`point${i}`];
              const p = answer?.type === 'noul' ? answer.p : 0.5;
              if (p > NOT_STATED && p < STATED) return;
              grading.points += 1;
              if (p >= STATED === covered) grading.pointsRight += 1;
            });
            const expected = verdictOf(item.covers);
            const got = readGrade(decision.answers, prompt.keyPoints).verdict;
            if (got === null) {
              grading.unsure += 1;
            } else {
              grading.verdicts += 1;
              if (got === expected) grading.agree += 1;
            }
            if (expected !== 'nailed') {
              grading.notNailed += 1;
              if (got === 'nailed') grading.falseNailed += 1;
            }
          } catch {
            grading.errors += 1;
          }
        }
        latencies.sort((a, b) => a - b);
        const median = latencies[Math.floor(latencies.length / 2)] ?? Infinity;

        const gate = {
          cases: 0,
          caught: 0,
          falseAlarms: 0,
          clean: 0,
          errors: 0,
        };
        for (const item of gateCases()) {
          try {
            const decision = await model.decide(
              gateState(item.span, item.explained),
              gateQuestions(item.explained),
            );
            const verdict = readGate(
              decision.answers,
              item.explained.prompts.length,
            );
            if (item.variant === 'clean') {
              gate.clean += 1;
              if (verdict.needsLook || verdict.leakyPrompts.length)
                gate.falseAlarms += 1;
            } else {
              gate.cases += 1;
              const caught =
                item.variant === 'leaky'
                  ? verdict.leakyPrompts.includes(item.leak ?? -1)
                  : verdict.needsLook;
              if (caught) gate.caught += 1;
            }
          } catch {
            gate.errors += 1;
          }
        }

        const agreement = grading.agree / Math.max(1, grading.verdicts);
        const falseNailed =
          grading.falseNailed / Math.max(1, grading.notNailed);
        const detection = gate.caught / Math.max(1, gate.cases);
        const falseAlarm = gate.falseAlarms / Math.max(1, gate.clean);
        report[name] = {
          grading: {
            ...grading,
            pointAccuracy: grading.pointsRight / Math.max(1, grading.points),
            agreement,
            falseNailedRate: falseNailed,
            unsureRate:
              grading.unsure / Math.max(1, grading.unsure + grading.verdicts),
            medianLatencyMs: Math.round(median),
            go: agreement >= 0.85 && falseNailed <= 0.1 && median < 1000,
          },
          gate: {
            ...gate,
            detection,
            falseAlarmRate: falseAlarm,
            go: detection >= 0.8 && falseAlarm <= 0.1,
          },
        };
      }
      mkdirSync('tmp/jev-spike', { recursive: true });
      writeFileSync(
        'tmp/jev-spike/report.json',
        `${JSON.stringify(report, null, 2)}\n`,
      );
      console.log(JSON.stringify(report, null, 2));
      expect(report['jev']).toBeDefined();
    },
  );
});
