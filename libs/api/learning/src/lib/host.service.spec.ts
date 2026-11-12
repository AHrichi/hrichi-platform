import {
  FIXTURE_IDS,
  hostCaptureId,
  MIN_SECRET_LENGTH,
  sampleConcept,
  verifyDeviceToken,
} from '@ah/learning/domain';
import { HostService } from './host.service';
import { InMemoryLearningRepository } from './testing/in-memory-learning.repository';

const secret = 's'.repeat(MIN_SECRET_LENGTH);
const now = new Date('2026-11-12T09:00:00Z');
const card = (objectId: string) => ({
  text: `Card ${objectId}`,
  source: {
    app: 'not-the-host',
    objectType: 'lesson-card',
    objectId,
    deepLink: null,
    excerpt: null,
  },
});

function setup(tokenExpiresAt = new Date('2027-05-01T00:00:00Z')) {
  const repository = new InMemoryLearningRepository();
  let kicks = 0;
  const service = new HostService(
    repository,
    secret,
    () => now,
    undefined,
    () => {
      kicks += 1;
    },
  );
  const host = {
    deviceId: FIXTURE_IDS.deviceB,
    app: 'studylm',
    tokenExpiresAt,
  };
  return { repository, service, host, kicks: () => kicks };
}

describe('HostService', () => {
  it('links a known host app with a token for its own device record', async () => {
    const { repository, service } = setup();
    const linked = await service.link({ app: 'studylm', name: 'StudyLM' });
    const claims = await verifyDeviceToken(secret, linked.token, now);
    expect(claims?.deviceId).toBe(linked.hostId);
    expect((await repository.findDevice(linked.hostId))?.host).toBe('studylm');
    await expect(
      service.link({ app: 'elsewhere', name: 'Elsewhere' }),
    ).rejects.toThrow(/No app by that name/);
  });

  it('stores each card once, as the host’s, and starts the pipeline', async () => {
    const { repository, service, host, kicks } = setup();
    const first = await service.addCaptures(host, {
      items: [card('a'), card('b'), card('a')],
    });
    expect(first).toEqual({ stored: 2, known: 1 });
    expect(kicks()).toBe(1);
    const id = await hostCaptureId('studylm', 'lesson-card', 'a');
    const stored = await repository.getRecord('capture', id);
    expect(stored?.by).toBe(host.deviceId);
    expect(stored?.data.source?.app).toBe('studylm');

    // A card the learner removed stays removed when it comes again.
    await repository.putMutable({
      ...(stored as NonNullable<typeof stored>),
      seq: await repository.nextSeq(),
      updatedAt: '2026-11-12T10:00:00.000Z',
      data: {
        ...(stored as NonNullable<typeof stored>).data,
        deletedAt: '2026-11-12T10:00:00.000Z',
      },
    });
    expect(await service.addCaptures(host, { items: [card('a')] })).toEqual({
      stored: 0,
      known: 1,
    });
    expect(kicks()).toBe(1);
  });

  it('counts answers for kept concepts only, once each', async () => {
    const { repository, service, host } = setup();
    await service.addCaptures(host, { items: [card('a')] });
    const id = await hostCaptureId('studylm', 'lesson-card', 'a');
    const stored = await repository.getRecord('capture', id);
    await repository.putMutable({
      ...(stored as NonNullable<typeof stored>),
      seq: await repository.nextSeq(),
      updatedAt: '2026-11-12T09:00:01.000Z',
      data: {
        ...(stored as NonNullable<typeof stored>).data,
        status: 'ready',
        conceptIds: [FIXTURE_IDS.concept],
      },
    });
    await repository.putMutable({
      kind: 'concept',
      id: FIXTURE_IDS.concept,
      seq: await repository.nextSeq(),
      by: FIXTURE_IDS.deviceA,
      updatedAt: '2026-11-12T08:00:00.000Z',
      data: sampleConcept({ updatedAt: '2026-11-12T08:00:00.000Z' }),
    });
    const answers = {
      timeZone: 'UTC',
      answers: [
        {
          id: FIXTURE_IDS.event,
          objectType: 'lesson-card',
          objectId: 'a',
          rating: 'hard' as const,
          at: '2026-11-12T08:30:00.000Z',
          ms: 1000,
        },
        {
          id: FIXTURE_IDS.session,
          objectType: 'lesson-card',
          objectId: 'never-sent',
          rating: 'good' as const,
          at: '2026-11-12T08:31:00.000Z',
          ms: 1000,
        },
      ],
    };
    expect(await service.addAnswers(host, answers)).toEqual({
      counted: 1,
      skipped: 1,
    });
    await service.addAnswers(host, answers);
    const events = await repository.recordsOfKind('event');
    expect(events).toHaveLength(1);
    expect(events[0].data).toMatchObject({
      conceptId: FIXTURE_IDS.concept,
      rating: 'hard',
      localDate: '2026-11-12',
    });
  });

  it('renews the link in its last 30 days', async () => {
    const soon = setup(new Date('2026-11-20T00:00:00Z'));
    const renewed = (await soon.service.state(soon.host, 'UTC')).renewedToken;
    expect(
      (await verifyDeviceToken(secret, renewed?.token ?? '', now))?.deviceId,
    ).toBe(FIXTURE_IDS.deviceB);
    const later = setup();
    expect((await later.service.state(later.host, 'UTC')).renewedToken).toBe(
      null,
    );
  });
});
