import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  FakeChannel,
  FakeVerifier,
  HUMAN_VERIFIER,
  InMemoryLeadsRepository,
  LEAD_CHANNELS,
  LEADS_REPOSITORY,
  leadRequest,
  MONGO_DB,
} from '@ah/api/leads';
import { AppModule } from './app.module';
import { loadConfig } from './config';
import { configureApp } from './configure-app';
import { MONGO_CLIENT } from './mongo.module';

const config = loadConfig({
  MONGODB_URI: 'mongodb://unused',
  TURNSTILE_SECRET: 'unused',
  CORS_ORIGINS: 'https://portfolio.example',
});

describe('API over HTTP', () => {
  let app: NestExpressApplication;
  let repository: InMemoryLeadsRepository;
  let telegram: FakeChannel;

  beforeEach(async () => {
    repository = new InMemoryLeadsRepository();
    telegram = new FakeChannel('telegram');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(config)],
    })
      .overrideProvider(MONGO_CLIENT)
      .useValue({ close: async () => undefined })
      .overrideProvider(MONGO_DB)
      .useValue({ command: async () => ({ ok: 1 }) })
      .overrideProvider(LEADS_REPOSITORY)
      .useValue(repository)
      .overrideProvider(LEAD_CHANNELS)
      .useValue([telegram, new FakeChannel('n8n', false)])
      .overrideProvider(HUMAN_VERIFIER)
      .useValue(new FakeVerifier())
      .compile();
    app = configureApp(
      moduleRef.createNestApplication<NestExpressApplication>(),
      config,
    );
    await app.init();
  });

  afterEach(() => app.close());

  it('reports health', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok', db: 'up' });
  });

  it('accepts a valid lead with 202 and stores it', async () => {
    const response = await request(app.getHttpServer())
      .post('/leads')
      .send(leadRequest())
      .expect(202);

    expect(response.body.status).toBe('accepted');
    expect(repository.leads.size).toBe(1);
    expect(telegram.sent).toHaveLength(1);
  });

  it('rejects invalid input and unknown fields with 400', async () => {
    await request(app.getHttpServer())
      .post('/leads')
      .send(leadRequest({ email: 'not-an-email' }))
      .expect(400);
    await request(app.getHttpServer())
      .post('/leads')
      .send({ ...leadRequest(), isAdmin: true })
      .expect(400);

    expect(repository.leads.size).toBe(0);
  });

  it('only allows the configured origin to read responses', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://portfolio.example');
    const other = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://evil.example');

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'https://portfolio.example',
    );
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
