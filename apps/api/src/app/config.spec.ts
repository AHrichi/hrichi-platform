import { loadConfig } from './config';

const base = {
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.example/',
  TURNSTILE_SECRET: '1x0000000000000000000000000000000AA',
};

describe('loadConfig', () => {
  it('reads required values and leaves optional channels disabled', () => {
    const config = loadConfig(base);

    expect(config.mongo).toEqual({
      uri: base.MONGODB_URI,
      dbName: 'portfolio',
    });
    expect(config.leads.telegram).toBeNull();
    expect(config.leads.n8n).toBeNull();
    expect(config.corsOrigins).toEqual(['http://localhost:4200']);
  });

  it('lists every problem at once', () => {
    expect(() =>
      loadConfig({
        TELEGRAM_BOT_TOKEN: 'only-half',
        N8N_WEBHOOK_URL: 'http://insecure.example',
        N8N_WEBHOOK_SECRET: 'x',
        PORT: 'abc',
      }),
    ).toThrow(
      /MONGODB_URI is required[\s\S]*TURNSTILE_SECRET is required[\s\S]*TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID[\s\S]*PORT must be a positive integer[\s\S]*N8N_WEBHOOK_URL must use https/,
    );
  });

  it('leaves the Learning Engine off until it has a long enough secret', () => {
    expect(loadConfig(base).learning).toBeNull();
    expect(() =>
      loadConfig({ ...base, LEARNING_TOKEN_SECRET: 'too-short' }),
    ).toThrow(/LEARNING_TOKEN_SECRET needs at least 32 characters/);

    const config = loadConfig({
      ...base,
      LEARNING_TOKEN_SECRET: 'x'.repeat(32),
      TELEGRAM_BOT_TOKEN: 'T',
      TELEGRAM_CHAT_ID: '42',
    });
    expect(config.learning).toEqual({
      tokenSecret: 'x'.repeat(32),
      telegram: { botToken: 'T', chatId: '42' },
      logPairingCodes: false,
      edgeUrl: null,
      ai: { groq: null, gemini: null, typesafe: null, n8n: null },
    });
    expect(config.studylm).toEqual({
      tokenSecret: 'x'.repeat(32),
      telegram: { botToken: 'T', chatId: '42' },
      logPairingCodes: false,
    });
  });

  it('allows configuring StudyLM sync independently via STUDYLM_TOKEN_SECRET', () => {
    const config = loadConfig({
      ...base,
      STUDYLM_TOKEN_SECRET: 's'.repeat(32),
    });
    expect(config.learning).toBeNull();
    expect(config.studylm).toEqual({
      tokenSecret: 's'.repeat(32),
      telegram: null,
      logPairingCodes: false,
    });
    expect(config.corsOrigins).toContain(
      'https://product-studylm.ahmed-hrichi.workers.dev',
    );
  });

  it('lets linked host apps in through CORS while the Learning Engine is on', () => {
    expect(loadConfig(base).corsOrigins).not.toContain(
      'https://product-studylm.ahmed-hrichi.workers.dev',
    );
    const config = loadConfig({
      ...base,
      CORS_ORIGINS: 'https://portfolio.example,http://localhost:4307',
      LEARNING_TOKEN_SECRET: 'x'.repeat(32),
    });
    expect(config.corsOrigins).toEqual([
      'https://portfolio.example',
      'http://localhost:4307',
      'https://product-studylm.ahmed-hrichi.workers.dev',
    ]);
  });

  it('refuses logged pairing codes in production', () => {
    expect(() =>
      loadConfig({
        ...base,
        NODE_ENV: 'production',
        LEARNING_TOKEN_SECRET: 'x'.repeat(32),
        LEARNING_LOG_PAIRING_CODES: 'true',
      }),
    ).toThrow(/LEARNING_LOG_PAIRING_CODES is for development only/);
  });

  it('parses channels and a comma-separated CORS allowlist', () => {
    const config = loadConfig({
      ...base,
      TELEGRAM_BOT_TOKEN: 'T',
      TELEGRAM_CHAT_ID: '42',
      N8N_WEBHOOK_URL: 'https://n8n.example/webhook/lead',
      N8N_WEBHOOK_SECRET: 's',
      CORS_ORIGINS: 'https://portfolio.example, http://localhost:4200',
    });

    expect(config.leads.telegram).toEqual({ botToken: 'T', chatId: '42' });
    expect(config.leads.n8n?.webhookUrl).toBe(
      'https://n8n.example/webhook/lead',
    );
    expect(config.corsOrigins).toEqual([
      'https://portfolio.example',
      'http://localhost:4200',
    ]);
  });
});
