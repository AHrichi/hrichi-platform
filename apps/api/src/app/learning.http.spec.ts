import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DISPATCH_MONGO_DB, MongoDispatchRepository } from '@ah/api/dispatch';
import {
  FakeChannel,
  FakeVerifier,
  HUMAN_VERIFIER,
  InMemoryLeadsRepository,
  LEAD_CHANNELS,
  LEADS_REPOSITORY,
  MONGO_DB,
} from '@ah/api/leads';
import {
  CapturePipeline,
  FakePairingNotifier,
  InMemoryLearningRepository,
  LEARNING_MONGO_DB,
  LEARNING_REPOSITORY,
  PAIRING_NOTIFIER,
} from '@ah/api/learning';
import {
  emptyPush,
  FIXTURE_IDS,
  hostCaptureId,
  sampleConcept,
  sampleTopic,
} from '@ah/learning/domain';
import { AppModule } from './app.module';
import { loadConfig } from './config';
import { configureApp } from './configure-app';
import { MONGO_CLIENT } from './mongo.module';

const config = loadConfig({
  MONGODB_URI: 'mongodb://unused',
  TURNSTILE_SECRET: 'unused',
  CORS_ORIGINS: 'https://learning.example',
  LEARNING_TOKEN_SECRET: 'a-test-secret-that-is-long-enough-123',
});

/**
 * Phase L1's promise over real HTTP: two devices pair through a code sent
 * to Telegram, then stay in sync; a revoked device is shut out.
 */
describe('Learning Engine over HTTP', () => {
  let app: NestExpressApplication;
  let notifier: FakePairingNotifier;
  let repository: InMemoryLearningRepository;

  beforeEach(async () => {
    notifier = new FakePairingNotifier();
    repository = new InMemoryLearningRepository();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(config)],
    })
      .overrideProvider(MONGO_CLIENT)
      .useValue({ close: async () => undefined })
      .overrideProvider(MONGO_DB)
      .useValue({ command: async () => ({ ok: 1 }) })
      .overrideProvider(DISPATCH_MONGO_DB)
      .useValue({})
      .overrideProvider(MongoDispatchRepository)
      .useValue({})
      // Leads are covered by app.http.spec.ts; stubbed here so nothing connects.
      .overrideProvider(LEADS_REPOSITORY)
      .useValue(new InMemoryLeadsRepository())
      .overrideProvider(LEAD_CHANNELS)
      .useValue([
        new FakeChannel('telegram', false),
        new FakeChannel('n8n', false),
      ])
      .overrideProvider(HUMAN_VERIFIER)
      .useValue(new FakeVerifier())
      .overrideProvider(LEARNING_MONGO_DB)
      .useValue({})
      .overrideProvider(LEARNING_REPOSITORY)
      .useValue(repository)
      .overrideProvider(PAIRING_NOTIFIER)
      .useValue(notifier)
      .compile();
    app = configureApp(
      moduleRef.createNestApplication<NestExpressApplication>(),
      config,
    );
    await app.init();
  });

  afterEach(() => app.close());

  async function pair(deviceName: string): Promise<string> {
    const started = await request(app.getHttpServer())
      .post('/learning/pairing')
      .send({ deviceName })
      .expect(201);
    const paired = await request(app.getHttpServer())
      .post(`/learning/pairing/${started.body.pairingId}/confirm`)
      .send({ code: notifier.lastCode })
      .expect(200);
    return paired.body.token as string;
  }

  function sync(token: string, body: object) {
    return request(app.getHttpServer())
      .post('/learning/sync')
      .set('authorization', `Bearer ${token}`)
      .send(body);
  }

  it('pairs two devices and syncs a concept between them', async () => {
    const phone = await pair('Phone');
    const laptop = await pair('Laptop');

    await sync(phone, {
      cursor: 0,
      push: {
        ...emptyPush(),
        topics: [sampleTopic()],
        concepts: [sampleConcept()],
      },
    }).expect(200);

    const pulled = await sync(laptop, { cursor: 0, push: emptyPush() }).expect(
      200,
    );
    expect(
      pulled.body.pull.map((record: { kind: string }) => record.kind),
    ).toEqual(['topic', 'concept']);
    expect(pulled.body.pull[1].data.id).toBe(FIXTURE_IDS.concept);

    const devices = await request(app.getHttpServer())
      .get('/learning/devices')
      .set('authorization', `Bearer ${laptop}`)
      .expect(200);
    expect(devices.body.map((device: { name: string }) => device.name)).toEqual(
      ['Phone', 'Laptop'],
    );
  });

  it('needs a token, and refuses a revoked device', async () => {
    await sync('', { cursor: 0, push: emptyPush() }).expect(401);
    await sync('v1.forged.1.token', { cursor: 0, push: emptyPush() }).expect(
      401,
    );

    const phone = await pair('Phone');
    const laptop = await pair('Laptop');
    const phoneId = [...repository.devices.values()].find(
      (device) => device.name === 'Phone',
    )?.id;
    await request(app.getHttpServer())
      .delete(`/learning/devices/${phoneId}`)
      .set('authorization', `Bearer ${laptop}`)
      .expect(204);
    await sync(phone, { cursor: 0, push: emptyPush() }).expect(401);
  });

  it('checks bodies against the shared contract', async () => {
    const phone = await pair('Phone');
    const response = await sync(phone, {
      cursor: 0,
      push: { ...emptyPush(), concepts: [{ ...sampleConcept(), extra: 1 }] },
    }).expect(400);
    expect(response.body.issues[0].path).toBe('push.concepts.0.extra');

    await request(app.getHttpServer())
      .post('/learning/pairing')
      .send({ deviceName: '' })
      .expect(400);
  });

  it('turns a wrong code away without pairing', async () => {
    const started = await request(app.getHttpServer())
      .post('/learning/pairing')
      .send({ deviceName: 'Tablet' })
      .expect(201);
    const wrong = notifier.lastCode === '000000' ? '111111' : '000000';
    await request(app.getHttpServer())
      .post(`/learning/pairing/${started.body.pairingId}/confirm`)
      .send({ code: wrong })
      .expect(400);
    expect(repository.devices.size).toBe(0);
  });

  it('links StudyLM: its cards and answers reach the engine, and nothing else', async () => {
    const phone = await pair('Phone');
    const linked = await request(app.getHttpServer())
      .post('/learning/hosts')
      .set('authorization', `Bearer ${phone}`)
      .send({ app: 'studylm', name: 'StudyLM on Chrome' })
      .expect(201);
    const host = linked.body.token as string;
    const as = (token: string) => ({ authorization: `Bearer ${token}` });

    // StudyLM's own origin gets through CORS.
    const preflight = await request(app.getHttpServer())
      .options('/learning/host/captures')
      .set('origin', 'https://product-studylm.ahmed-hrichi.workers.dev')
      .set('access-control-request-method', 'POST')
      .set('access-control-request-headers', 'authorization,content-type');
    expect(preflight.headers['access-control-allow-origin']).toBe(
      'https://product-studylm.ahmed-hrichi.workers.dev',
    );

    const card = {
      text: 'What does BFS use for its frontier? A queue.',
      source: {
        app: 'studylm',
        objectType: 'flashcard',
        objectId: 'fc-1',
        deepLink: null,
        excerpt: null,
      },
    };
    const send = () =>
      request(app.getHttpServer())
        .post('/learning/host/captures')
        .set(as(host))
        .send({ items: [card] })
        .expect(200);
    expect((await send()).body).toEqual({ stored: 1, known: 0 });
    expect((await send()).body).toEqual({ stored: 0, known: 1 });
    // Without AI keys the capture waits; let that run finish first.
    await app.get(CapturePipeline).kick();

    const answer = (id: string) =>
      request(app.getHttpServer())
        .post('/learning/host/answers')
        .set(as(host))
        .send({
          timeZone: 'UTC',
          answers: [
            {
              id,
              objectType: 'flashcard',
              objectId: 'fc-1',
              rating: 'good',
              at: new Date(Date.now() - 60_000).toISOString(),
              ms: 3000,
            },
          ],
        })
        .expect(200);
    // Not in the reviews yet: nothing to count.
    expect((await answer(FIXTURE_IDS.event)).body).toEqual({
      counted: 0,
      skipped: 1,
    });

    // The pipeline turned it into a concept, and it was kept.
    const captureId = await hostCaptureId('studylm', 'flashcard', 'fc-1');
    const stored = await repository.getRecord('capture', captureId);
    const later = new Date(Date.now() + 1000).toISOString();
    await repository.putMutable({
      kind: 'concept',
      id: FIXTURE_IDS.concept,
      seq: await repository.nextSeq(),
      by: FIXTURE_IDS.deviceA,
      updatedAt: later,
      data: sampleConcept({ updatedAt: later }),
    });
    await repository.putMutable({
      kind: 'capture',
      id: captureId,
      seq: await repository.nextSeq(),
      by: FIXTURE_IDS.deviceA,
      updatedAt: later,
      data: {
        ...(stored?.data as NonNullable<typeof stored>['data']),
        status: 'ready',
        updatedAt: later,
        conceptIds: [FIXTURE_IDS.concept],
      },
    });
    expect((await answer(FIXTURE_IDS.session)).body).toEqual({
      counted: 1,
      skipped: 0,
    });
    // The phone pulls the answer as a review event.
    const pulled = await sync(phone, { cursor: 0, push: emptyPush() }).expect(
      200,
    );
    expect(
      pulled.body.pull.filter((r: { kind: string }) => r.kind === 'event'),
    ).toHaveLength(1);

    const state = await request(app.getHttpServer())
      .get('/learning/host/state?timeZone=UTC')
      .set(as(host))
      .expect(200);
    expect(state.body.items[0]).toMatchObject({
      objectId: 'fc-1',
      stage: 'reviewing',
    });
    expect(state.body.streak.todayCounted).toBe(true);

    // A host link reaches the host routes only, and a device can't use them.
    await sync(host, { cursor: 0, push: emptyPush() }).expect(401);
    await request(app.getHttpServer())
      .post('/learning/hosts')
      .set(as(host))
      .send({ app: 'studylm', name: 'again' })
      .expect(401);
    await request(app.getHttpServer())
      .get('/learning/host/state?timeZone=UTC')
      .set(as(phone))
      .expect(401);
    await request(app.getHttpServer())
      .post('/learning/hosts')
      .set(as(phone))
      .send({ app: 'nope', name: 'Nope' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/learning/host/state?timeZone=Mars/Base')
      .set(as(host))
      .expect(400);

    // Disconnect ends the link.
    await request(app.getHttpServer())
      .delete('/learning/host')
      .set(as(host))
      .expect(204);
    await request(app.getHttpServer())
      .get('/learning/host/state?timeZone=UTC')
      .set(as(host))
      .expect(401);
  });

  it('rejects a revise request with 409 when expectedVersion is stale', async () => {
    const phone = await pair('Phone');
    await repository.putMutable({
      kind: 'concept',
      id: FIXTURE_IDS.concept,
      seq: await repository.nextSeq(),
      by: FIXTURE_IDS.deviceA,
      updatedAt: new Date().toISOString(),
      data: sampleConcept({ updatedAt: new Date().toISOString(), version: 2 }),
    });
    await request(app.getHttpServer())
      .post(`/learning/concepts/${FIXTURE_IDS.concept}/revise`)
      .set({ authorization: `Bearer ${phone}` })
      .send({ instruction: 'simpler', expectedVersion: 1 })
      .expect(409);
  });
});
