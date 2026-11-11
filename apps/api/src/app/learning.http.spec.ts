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
  FakePairingNotifier,
  InMemoryLearningRepository,
  LEARNING_MONGO_DB,
  LEARNING_REPOSITORY,
  PAIRING_NOTIFIER,
} from '@ah/api/learning';
import {
  emptyPush,
  FIXTURE_IDS,
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
});
