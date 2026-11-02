import {
  type GenerateRequest,
  type GenerateResponse,
  type Lesson,
  type LessonOutline,
  loadBuiltInLessons,
  SPEC_VERSION,
  validateLesson,
} from '@ah/products/studylm/lessons';
import {
  assembleLesson,
  BUSY_RETRY_MS,
  formatId,
  LessonGenerationError,
  LessonGenerator,
  lessonIdFor,
} from './lesson-generator';

let golden: Lesson;
beforeAll(async () => {
  golden = (await loadBuiltInLessons()).find(
    (l) => l.id === 'binary-search',
  ) as Lesson;
});

/** The plan the golden lesson would have come from. */
function outlineOf(lesson: Lesson): LessonOutline {
  return {
    title: lesson.title,
    minutes: lesson.minutes,
    objectives: lesson.objectives,
    sections: lesson.sections.map((s) => ({
      id: s.id,
      title: s.title,
      intent: s.intent,
      blocks: s.blocks.map((b) => ({
        id: b.id,
        kind: b.kind,
        brief: `The ${b.kind} block ${b.id}.`,
      })),
    })),
    cards: lesson.cards,
  };
}

const ok = (data: unknown): GenerateResponse => ({
  success: true,
  code: 'OK',
  provider: 'test model',
  specVersion: SPEC_VERSION,
  data,
  message: null,
});

/** A workflow that answers from the golden lesson, with overrides by block. */
function fakeWorkflow(
  overrides: Record<string, (task: string) => unknown> = {},
) {
  const calls: GenerateRequest[] = [];
  const blocks = new Map(
    golden.sections.flatMap((s) => s.blocks.map((b) => [b.id, b])),
  );
  const ask = async (request: GenerateRequest) => {
    calls.push(request);
    const input = request.input as Record<string, unknown>;
    if (request.task === 'lesson-outline') return ok(outlineOf(golden));
    const id =
      request.task === 'lesson-block'
        ? (input['blockId'] as string)
        : (input['block'] as { id: string }).id;
    const override = overrides[id];
    return ok(override ? override(request.task) : blocks.get(id));
  };
  return { ask, calls };
}

const topic = {
  subject: 'Algorithms',
  sectionTitle: 'Binary search',
  sectionSummary: 'Finding a value in a sorted array by halving.',
  subtopics: ['lo, hi and mid'],
  tier: 'beginner' as const,
};

async function generate(
  generator: LessonGenerator,
  signal = new AbortController().signal,
) {
  const { outline, provider } = await generator.outline(topic, signal);
  const draft = await generator.write(
    outline,
    topic.tier,
    provider,
    signal,
    () => undefined,
  );
  return draft;
}

describe('LessonGenerator', () => {
  it('writes every block and assembles a lesson that passes every check', async () => {
    const { ask } = fakeWorkflow();
    const draft = await generate(new LessonGenerator(ask));
    expect(Object.values(draft.blocks).every((b) => b.state === 'ready')).toBe(
      true,
    );
    const lesson = assembleLesson('gen-1', 's-binary-search', draft);
    expect(validateLesson(lesson)).toMatchObject({ ok: true });
    expect(lesson.sections.flatMap((s) => s.blocks.map((b) => b.id))).toEqual(
      golden.sections.flatMap((s) => s.blocks.map((b) => b.id)),
    );
  });

  it('repairs a block that fails its checks, once', async () => {
    const good = golden.sections
      .flatMap((s) => s.blocks)
      .find((b) => b.id === 'predict-steps');
    const { ask, calls } = fakeWorkflow({
      // An answer index beyond the options: the checks reject it.
      'predict-steps': (task) =>
        task === 'lesson-block' ? { ...good, answer: 9 } : good,
    });
    const draft = await generate(new LessonGenerator(ask));
    expect(draft.blocks['predict-steps']).toMatchObject({
      state: 'ready',
      repaired: true,
    });
    const repair = calls.find((c) => c.task === 'block-repair');
    expect(
      (repair?.input as { issues: { path: string }[] }).issues[0].path,
    ).toContain('/answer');
  });

  it('skips a block that still fails after its repair, and keeps the rest', async () => {
    const broken = { id: 'predict-steps', kind: 'predict', question: '?' };
    const { ask } = fakeWorkflow({ 'predict-steps': () => broken });
    const draft = await generate(new LessonGenerator(ask));
    expect(draft.blocks['predict-steps'].state).toBe('skipped');
    const lesson = assembleLesson('gen-1', 's-binary-search', draft);
    expect(
      lesson.sections
        .flatMap((s) => s.blocks)
        .some((b) => b.id === 'predict-steps'),
    ).toBe(false);
    expect(validateLesson(lesson)).toMatchObject({ ok: true });
  });

  it('tells the learner to re-import the workflow when the versions differ', async () => {
    const generator = new LessonGenerator(async () => ({
      ...ok(null),
      success: false,
      code: 'SPEC_MISMATCH',
      specVersion: SPEC_VERSION + 1,
    }));
    await expect(
      generator.outline(topic, new AbortController().signal),
    ).rejects.toThrow(LessonGenerationError);
    await expect(
      generator.outline(topic, new AbortController().signal),
    ).rejects.toThrow(/Re-import/);
  });

  it('writes blocks side by side in two lanes', async () => {
    const { ask, calls } = fakeWorkflow();
    await generate(new LessonGenerator(ask));
    const lanes = new Set(
      calls.filter((c) => c.task === 'lesson-block').map((c) => c.lane),
    );
    expect(lanes).toEqual(new Set([0, 1]));
  });

  it('waits and tries once more when every model was busy', async () => {
    const { ask } = fakeWorkflow();
    const busy = {
      ...ok(null),
      success: false,
      code: 'AI_FAILOVER_EXHAUSTED' as const,
      message: 'All four AI models failed.',
    };
    let outlineCalls = 0;
    const pauses: number[] = [];
    const generator = new LessonGenerator(
      async (request, signal) => {
        if (request.task === 'lesson-outline' && outlineCalls++ === 0) {
          return busy;
        }
        return ask(request, signal);
      },
      async (ms) => {
        pauses.push(ms);
      },
    );
    await expect(
      generator.outline(topic, new AbortController().signal),
    ).resolves.toMatchObject({ provider: 'test model' });
    expect(pauses).toEqual([BUSY_RETRY_MS]);

    const always = new LessonGenerator(
      async () => busy,
      async () => undefined,
    );
    await expect(
      always.outline(topic, new AbortController().signal),
    ).rejects.toThrow('All four AI models failed.');
  });

  it('stops when cancelled', async () => {
    const controller = new AbortController();
    const { ask } = fakeWorkflow();
    const generator = new LessonGenerator(async (request, signal) => {
      if (request.task === 'lesson-block') controller.abort();
      return ask(request, signal);
    });
    await expect(generate(generator, controller.signal)).rejects.toThrow();
  });
});

describe('ids', () => {
  it('derives a stable lesson id and a section id in the format', () => {
    expect(lessonIdFor('subj-1', 'Sec 1.2')).toBe(
      lessonIdFor('subj-1', 'Sec 1.2'),
    );
    expect(lessonIdFor('subj-1', 'Sec 1.2')).toMatch(/^gen-[0-9a-f]{8}$/);
    expect(formatId('Sec 1.2: Event Loop!')).toBe('s-sec-1-2-event-loop');
  });
});
