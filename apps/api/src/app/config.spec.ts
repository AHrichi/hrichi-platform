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
