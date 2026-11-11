import { ModelLadder } from '@ah/api/ai';
import {
  type Capture,
  type Concept,
  emptyPush,
  FIXTURE_IDS,
  GOLDEN_CONCEPTS,
  MIN_SECRET_LENGTH,
  sampleCapture,
  SERVER_WRITER,
} from '@ah/learning/domain';
import {
  AUTO_CONFIRM_MS,
  CapturePipeline,
  MAX_ATTEMPTS,
} from './capture-pipeline';
import { SyncService } from './sync.service';
import { fakeAi, FakeTranscriber, ScriptedModel } from './testing/ai-fakes';
import { InMemoryLearningRepository } from './testing/in-memory-learning.repository';
import { WriteLock } from './write-lock';

const golden = GOLDEN_CONCEPTS[0];
const extracted = {
  concepts: [
    {
      title: golden.title,
      type: golden.type,
      topic: golden.topic,
      span: golden.span,
    },
  ],
};
const learnable = {
  kind: {
    type: 'choice' as const,
    choice: 'learnable',
    confidence: 0.95,
    probabilities: {},
  },
};

function setup(ai = fakeAi()) {
  const repository = new InMemoryLearningRepository();
  let now = new Date('2026-11-11T09:00:00Z');
  const lock = new WriteLock();
  const pipeline = new CapturePipeline(repository, lock, ai, () => now);
  ai.decisions.answers = { ...learnable };
  const seed = async (capture: Capture) =>
    repository.putMutable({
      kind: 'capture',
      id: capture.id,
      seq: await repository.nextSeq(),
      by: FIXTURE_IDS.deviceA,
      updatedAt: capture.updatedAt,
      data: capture,
    });
  const capture = async () =>
    (await repository.getRecord('capture', FIXTURE_IDS.capture))?.data;
  const concepts = async () =>
    [...repository.records.values()]
      .filter((record) => record.kind === 'concept')
      .map((record) => record.data as Concept);
  return {
    repository,
    pipeline,
    ai,
    lock,
    seed,
    capture,
    concepts,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
  };
}

describe('CapturePipeline', () => {
  it('turns a typed capture into a draft concept in a new topic', async () => {
    const { pipeline, ai, seed, capture, concepts, repository } = setup();
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(sampleCapture());

    expect(await pipeline.runOnce()).toBe(1);

    const [concept] = await concepts();
    expect(concept).toMatchObject({
      title: 'Opportunity cost',
      status: 'draft',
      confirmedAt: null,
      explanation: { essence: golden.explained.essence, by: 'ai' },
    });
    expect(concept.sources[0]).toMatchObject({ objectId: FIXTURE_IDS.capture });
    expect(await capture()).toMatchObject({
      status: 'ready',
      error: null,
      conceptIds: [concept.id],
    });
    const topics = await repository.liveTopics();
    expect(topics.map((topic) => topic.data.name)).toEqual(['Economics']);
    expect(concept.topicId).toBe(topics[0].data.id);
    // Server versions carry the server's writer id.
    expect(repository.records.get(`concept:${concept.id}`)?.by).toBe(
      SERVER_WRITER,
    );
  });

  it('reuses an existing topic and tells the model about it', async () => {
    const { pipeline, ai, seed, repository } = setup();
    ai.model
      .add('extract_concepts', extracted, extracted)
      .add('explain_concept', golden.explained, golden.explained);
    await seed(sampleCapture());
    await pipeline.runOnce();
    await seed(sampleCapture({ id: crypto.randomUUID() }));
    await pipeline.runOnce();
    expect((await repository.liveTopics()).length).toBe(1);
    expect(ai.model.calls.at(-2)?.user).toContain('"Economics"');
  });

  it('repairs an explanation once when it breaks a rule', async () => {
    const { pipeline, ai, seed, capture } = setup();
    const tooLong = { ...golden.explained, essence: 'word '.repeat(30).trim() };
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', tooLong, golden.explained);
    await seed(sampleCapture());
    await pipeline.runOnce();
    expect(ai.model.calls.at(-1)?.user).toContain('/essence:');
    expect((await capture())?.status).toBe('ready');
  });

  it('counts a failed run and gives up after three', async () => {
    const { pipeline, ai, seed, capture } = setup();
    const broken = { ...golden.explained, prompts: [] };
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      ai.model
        .add('extract_concepts', extracted)
        .add('explain_concept', broken, broken);
    }
    await seed(sampleCapture());

    await pipeline.runOnce();
    expect(await capture()).toMatchObject({
      status: 'queued',
      attempts: 1,
      error: expect.stringContaining('try 1 of 3'),
    });
    await pipeline.runOnce();
    await pipeline.runOnce();
    expect(await capture()).toMatchObject({ status: 'failed', attempts: 3 });
    // A failed capture isn't picked up again.
    expect(await pipeline.runOnce()).toBe(0);
  });

  it('asks before processing a to-do, unless told to go ahead', async () => {
    const { pipeline, ai, seed, capture, concepts } = setup();
    ai.decisions.answers = {
      kind: {
        type: 'choice',
        choice: 'todo',
        confidence: 0.9,
        probabilities: {},
      },
    };
    await seed(sampleCapture({ text: 'Buy milk' }));
    await pipeline.runOnce();
    expect(await capture()).toMatchObject({
      status: 'needs_look',
      error: expect.stringContaining('to-do'),
    });
    expect(await concepts()).toEqual([]);

    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(
      sampleCapture({
        text: 'Buy milk',
        force: true,
        status: 'queued',
        updatedAt: '2026-11-11T08:30:00.000Z',
      }),
    );
    // The device's "process anyway" is older than the server's version here,
    // so it is kept; a real device stamps after the version it saw.
    await pipeline.runOnce();
    expect((await capture())?.status).toBe('needs_look');
  });

  it('carries on when the decision model is down', async () => {
    const { pipeline, ai, seed, capture } = setup();
    ai.decisions.failing = true;
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(sampleCapture());
    await pipeline.runOnce();
    expect((await capture())?.status).toBe('ready');
  });

  it('flags a concept the quality gate doubts and retires a leaky prompt', async () => {
    const { pipeline, ai, seed, capture, concepts } = setup();
    ai.decisions.answers = {
      ...learnable,
      faithful: { type: 'noul', p: 0.1 },
      misconception: { type: 'noul', p: 0.9 },
      leak2: { type: 'noul', p: 0.95 },
    };
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(sampleCapture());
    await pipeline.runOnce();
    expect(await capture()).toMatchObject({
      status: 'needs_look',
      error: expect.stringContaining('doesn’t support'),
    });
    expect((await concepts())[0].prompts.map((p) => p.retired)).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it('waits, saying so once, when the server has no AI keys', async () => {
    const ai = { ...fakeAi(), ladder: new ModelLadder([]) };
    const { pipeline, seed, capture, repository } = setup(ai);
    await seed(sampleCapture());
    await pipeline.runOnce();
    await pipeline.runOnce();
    expect(await capture()).toMatchObject({
      status: 'queued',
      error: expect.stringContaining('no AI keys'),
    });
    // One version for the seed, one for the message; none for the second run.
    expect(
      (await repository.changesSince(0, 10)).at(-1)?.seq,
    ).toBeLessThanOrEqual(2);
  });

  it('holds a voice note until its audio arrives, then transcribes it', async () => {
    const transcriber = new FakeTranscriber();
    const { pipeline, ai, seed, capture } = setup(
      fakeAi(new ScriptedModel(), undefined, transcriber),
    );
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(
      sampleCapture({ modality: 'voice', text: null, hasAudio: true }),
    );
    expect(await pipeline.runOnce()).toBe(0);

    await pipeline.receiveAudio(FIXTURE_IDS.capture, {
      bytes: new Uint8Array([1, 2]),
      mimeType: 'audio/webm',
    });
    await pipeline.kick();
    expect(transcriber.heard).toHaveLength(1);
    expect(await capture()).toMatchObject({
      transcript: expect.stringContaining('Spaced repetition'),
      status: 'ready',
    });
    expect(ai.model.calls[0].user).toContain('Spaced repetition');
  });

  it('rewrites an explanation on request', async () => {
    const { pipeline, ai, seed, concepts } = setup();
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(sampleCapture());
    await pipeline.runOnce();
    const [draft] = await concepts();

    ai.model.add('revise_explanation', {
      essence: 'What you miss out on when you pick one thing.',
      simple: 'Choosing one thing means not getting the best other thing.',
      analogy: 'It is like picking one toy and leaving the other.',
      misconception: 'It is not every option, only the best one.',
    });
    const revised = await pipeline.revise(draft.id, 'simpler');
    expect(revised.explanation.essence).toBe(
      'What you miss out on when you pick one thing.',
    );
    expect(Date.parse(revised.updatedAt)).toBeGreaterThan(
      Date.parse(draft.updatedAt),
    );
    await expect(
      pipeline.revise(FIXTURE_IDS.concept, 'simpler'),
    ).rejects.toMatchObject({
      reason: 'not_found',
    });
  });

  it('keeps drafts nobody looked at after 48 hours', async () => {
    const { pipeline, ai, seed, concepts, advance } = setup();
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    await seed(sampleCapture());
    await pipeline.runOnce();
    advance(AUTO_CONFIRM_MS - 1000);
    await pipeline.sweep();
    expect((await concepts())[0].status).toBe('draft');
    advance(2000);
    await pipeline.sweep();
    expect((await concepts())[0]).toMatchObject({ status: 'active' });
  });

  it('starts when a sync brings a capture', async () => {
    const { repository, ai, lock } = setup();
    ai.model
      .add('extract_concepts', extracted)
      .add('explain_concept', golden.explained);
    const pipeline = new CapturePipeline(repository, lock, ai);
    let kicked: Promise<void> | null = null;
    const sync = new SyncService(
      repository,
      's'.repeat(MIN_SECRET_LENGTH),
      () => new Date('2026-11-11T09:00:00Z'),
      lock,
      () => {
        kicked = pipeline.kick();
      },
    );
    await sync.sync(
      { deviceId: FIXTURE_IDS.deviceA, tokenExpiresAt: new Date('2027-05-01') },
      { cursor: 0, push: { ...emptyPush(), captures: [sampleCapture()] } },
    );
    expect(kicked).not.toBeNull();
    await kicked;
    expect(
      (await repository.getRecord('capture', FIXTURE_IDS.capture))?.data.status,
    ).toBe('ready');
  });
});
