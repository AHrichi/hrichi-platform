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
  InMemoryLearningRepository,
  LEARNING_MONGO_DB,
  LEARNING_REPOSITORY,
} from '@ah/api/learning';
import {
  FakeStudyLmPairingNotifier,
  InMemoryStudyLmRepository,
  STUDYLM_MONGO_DB,
  STUDYLM_PAIRING_NOTIFIER,
  STUDYLM_REPOSITORY,
} from '@ah/api/studylm';
import { emptyStudyLmPush } from '@ah/products/studylm/domain';
import { AppModule } from './app.module';
import { loadConfig } from './config';
import { configureApp } from './configure-app';
import { MONGO_CLIENT } from './mongo.module';

const config = loadConfig({
  MONGODB_URI: 'mongodb://unused',
  TURNSTILE_SECRET: 'unused',
  CORS_ORIGINS: 'https://product-studylm.ahmed-hrichi.workers.dev',
  LEARNING_TOKEN_SECRET: 'a-test-secret-that-is-long-enough-123',
});

describe('StudyLM Sync over HTTP', () => {
  let app: NestExpressApplication;
  let notifier: FakeStudyLmPairingNotifier;
  let repository: InMemoryStudyLmRepository;

  beforeEach(async () => {
    notifier = new FakeStudyLmPairingNotifier();
    repository = new InMemoryStudyLmRepository();
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
      .useValue(new InMemoryLearningRepository())
      .overrideProvider(STUDYLM_MONGO_DB)
      .useValue({})
      .overrideProvider(STUDYLM_REPOSITORY)
      .useValue(repository)
      .overrideProvider(STUDYLM_PAIRING_NOTIFIER)
      .useValue(notifier)
      .compile();
    app = configureApp(
      moduleRef.createNestApplication<NestExpressApplication>(),
      config,
    );
    await app.init();
  });

  afterEach(() => app.close());

  async function pair(
    deviceName: string,
  ): Promise<{ token: string; id: string }> {
    const start = await request(app.getHttpServer())
      .post('/studylm/pairing')
      .send({ deviceName })
      .expect(201);
    const code = notifier.sent.at(-1)?.code ?? '';
    const confirm = await request(app.getHttpServer())
      .post(`/studylm/pairing/${start.body.pairingId}/confirm`)
      .send({ code })
      .expect(200);
    return { token: confirm.body.token, id: confirm.body.deviceId };
  }

  it('pairs two devices and syncs subjects, generated lessons, progress, and settings', async () => {
    await request(app.getHttpServer())
      .post('/studylm/sync')
      .send({ cursor: 0, push: emptyStudyLmPush() })
      .expect(401);

    const laptop = await pair('Laptop');
    const phone = await pair('Phone');

    await request(app.getHttpServer())
      .post('/studylm/sync')
      .set('authorization', `Bearer ${laptop.token}`)
      .send({
        cursor: 0,
        push: {
          subjects: [
            {
              id: 'subj-1',
              title: 'Rust Async',
              sources: [],
              overview: null,
              flashcards: [],
              quizQuestions: [],
              createdAt: '2026-11-13T10:00:00.000Z',
              updatedAt: '2026-11-13T10:05:00.000Z',
              deletedAt: null,
            },
          ],
          lessons: [
            {
              id: 'gen-subj-1-sec-1',
              subjectId: 'subj-1',
              sectionId: 'sec-1',
              draft: { tier: 'intermediate', blocks: {} },
              lesson: {
                id: 'gen-subj-1-sec-1',
                title: 'Pin and Future Polling',
                sections: [],
              },
              generatedAt: '2026-11-13T10:06:00.000Z',
              updatedAt: '2026-11-13T10:06:00.000Z',
              deletedAt: null,
            },
          ],
          progress: [
            {
              lessonId: 'gen-subj-1-sec-1',
              steps: { s0: -1, s1: 2 },
              checks: { c1: { answer: 0, correct: true } },
              completedAt: null,
              updatedAt: '2026-11-13T10:07:00.000Z',
            },
          ],
          settings: [
            {
              key: 'activeSubjectId',
              value: 'subj-1',
              updatedAt: '2026-11-13T10:08:00.000Z',
            },
          ],
        },
      })
      .expect(200);

    const pulled = await request(app.getHttpServer())
      .post('/studylm/sync')
      .set('authorization', `Bearer ${phone.token}`)
      .send({ cursor: 0, push: emptyStudyLmPush() })
      .expect(200);

    expect(pulled.body.cursor).toBe(4);
    expect(pulled.body.pull).toHaveLength(4);
    expect(pulled.body.pull[1].data).toMatchObject({
      id: 'gen-subj-1-sec-1',
      lesson: { title: 'Pin and Future Polling' },
    });

    const devices = await request(app.getHttpServer())
      .get('/studylm/devices')
      .set('authorization', `Bearer ${phone.token}`)
      .expect(200);
    expect(devices.body).toHaveLength(2);

    await request(app.getHttpServer())
      .delete(`/studylm/devices/${laptop.id}`)
      .set('authorization', `Bearer ${phone.token}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/studylm/sync')
      .set('authorization', `Bearer ${laptop.token}`)
      .send({ cursor: 4, push: emptyStudyLmPush() })
      .expect(401);
  });

  it('rejects too many wrong pairing codes and accepts large generated lessons', async () => {
    const start = await request(app.getHttpServer())
      .post('/studylm/pairing')
      .send({ deviceName: 'Tablet' })
      .expect(201);

    for (let i = 0; i < 4; i++) {
      await request(app.getHttpServer())
        .post(`/studylm/pairing/${start.body.pairingId}/confirm`)
        .send({ code: '000000' })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post(`/studylm/pairing/${start.body.pairingId}/confirm`)
      .send({ code: '000000' })
      .expect(404);

    const tablet = await pair('Tablet');
    const largeText = 'x'.repeat(180_000);
    await request(app.getHttpServer())
      .post('/studylm/sync')
      .set('authorization', `Bearer ${tablet.token}`)
      .send({
        cursor: 0,
        push: {
          ...emptyStudyLmPush(),
          lessons: [
            {
              id: 'gen-large-1',
              subjectId: 'subj-1',
              sectionId: 'sec-1',
              draft: { prose: largeText },
              lesson: {
                id: 'gen-large-1',
                title: 'Large Lesson',
                sections: [{ title: largeText }],
              },
              generatedAt: '2026-11-13T10:10:00.000Z',
              updatedAt: '2026-11-13T10:10:00.000Z',
              deletedAt: null,
            },
          ],
        },
      })
      .expect(200);
  });
});
