import type { LeadsModuleOptions } from '@ah/api/leads';

export interface ApiConfig {
  port: number;
  corsOrigins: string[];
  mongo: { uri: string; dbName: string };
  leads: LeadsModuleOptions;
}

/**
 * Reads and validates the environment once at boot. Missing secrets stop the
 * process with a list of problems instead of starting half-configured.
 * Telegram and n8n are optional: unset, their deliveries are marked disabled.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const problems: string[] = [];
  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) {
      problems.push(`${name} is required`);
    }
    return value ?? '';
  };
  const pair = <T>(
    names: [string, string],
    build: (a: string, b: string) => T,
  ) => {
    const [a, b] = names.map((name) => env[name]?.trim() ?? '');
    if (!a && !b) {
      return null;
    }
    if (!a || !b) {
      problems.push(`Set both ${names.join(' and ')}, or neither`);
      return null;
    }
    return build(a, b);
  };

  const config: ApiConfig = {
    port: Number(env['PORT'] ?? 3000),
    corsOrigins: (env['CORS_ORIGINS'] ?? 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    mongo: {
      uri: required('MONGODB_URI'),
      dbName: env['MONGODB_DB']?.trim() || 'portfolio',
    },
    leads: {
      turnstileSecret: required('TURNSTILE_SECRET'),
      telegram: pair(
        ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
        (botToken, chatId) => ({
          botToken,
          chatId,
        }),
      ),
      n8n: pair(
        ['N8N_WEBHOOK_URL', 'N8N_WEBHOOK_SECRET'],
        (webhookUrl, secret) => ({
          webhookUrl,
          secret,
        }),
      ),
    },
  };

  if (!Number.isInteger(config.port) || config.port <= 0) {
    problems.push('PORT must be a positive integer');
  }
  if (config.leads.n8n && !config.leads.n8n.webhookUrl.startsWith('https://')) {
    problems.push('N8N_WEBHOOK_URL must use https');
  }
  if (problems.length) {
    throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }
  return config;
}
