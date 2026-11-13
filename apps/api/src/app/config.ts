import type { LeadsModuleOptions } from '@ah/api/leads';
import type { LearningModuleOptions } from '@ah/api/learning';
import type { StudyLmModuleOptions } from '@ah/api/studylm';
import { hostOrigins } from '@ah/learning/contracts';
import { MIN_SECRET_LENGTH } from '@ah/learning/domain';
import { STUDYLM_ORIGINS } from '@ah/products/studylm/domain';

export interface ApiConfig {
  port: number;
  corsOrigins: string[];
  mongo: { uri: string; dbName: string };
  leads: LeadsModuleOptions;
  dispatch: {
    authSecret: string;
    encryptionKey: string;
  };
  /** The Learning Engine; off until LEARNING_TOKEN_SECRET is set (ADR-0024). */
  learning: LearningModuleOptions | null;
  /** Cross-device StudyLM sync; enabled via STUDYLM_TOKEN_SECRET or LEARNING_TOKEN_SECRET. */
  studylm: StudyLmModuleOptions | null;
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
    dispatch: {
      authSecret:
        env['DISPATCH_AUTH_SECRET']?.trim() ||
        'pulseops-london-dispatch-secure-auth-secret-2026',
      encryptionKey:
        env['DISPATCH_ENCRYPTION_KEY']?.trim() ||
        '0123456789abcdef0123456789abcdef', // 32 hex chars / 16 bytes minimum
    },
    learning: learningConfig(env, problems),
    studylm: studylmConfig(env, problems),
  };

  if (!Number.isInteger(config.port) || config.port <= 0) {
    problems.push('PORT must be a positive integer');
  }
  if (config.leads.n8n && !config.leads.n8n.webhookUrl.startsWith('https://')) {
    problems.push('N8N_WEBHOOK_URL must use https');
  }
  if (config.learning) {
    config.learning.telegram = config.leads.telegram;
    // Host apps linked to the Learning Engine (StudyLM) call its host
    // routes from their own origins (design §9), so they are always in.
    config.corsOrigins = [
      ...new Set([...config.corsOrigins, ...hostOrigins()]),
    ];
  }
  if (config.studylm) {
    config.studylm.telegram = config.leads.telegram;
    config.corsOrigins = [
      ...new Set([...config.corsOrigins, ...STUDYLM_ORIGINS]),
    ];
  }
  if (problems.length) {
    throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }
  return config;
}

/**
 * The n8n relay (ADR-0024): model calls go through n8n, which holds the
 * Groq and Gemini keys. Both values or neither.
 */
function n8nRelay(
  url: string | null,
  secret: string | null,
  problems: string[],
): { url: string; secret: string } | null {
  if (!url && !secret) return null;
  if (!url || !secret) {
    problems.push('LEARNING_N8N_URL and LEARNING_N8N_SECRET go together');
    return null;
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    problems.push(
      `LEARNING_N8N_SECRET needs at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  if (!/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    problems.push('LEARNING_N8N_URL must be an https URL');
    return null;
  }
  return { url: url.replace(/\/+$/, ''), secret };
}

/** The edge Worker's URL, for Telegram capture: https, or http on localhost. */
function edgeUrl(value: string | null, problems: string[]): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol === 'https:' || (local && url.protocol === 'http:')) {
      return value.replace(/\/+$/, '');
    }
  } catch {
    // Reported below.
  }
  problems.push('LEARNING_EDGE_URL must be an https URL');
  return null;
}

/**
 * The Learning Engine is optional: without LEARNING_TOKEN_SECRET its routes
 * aren't registered and nothing else changes. Pairing codes go to the same
 * Telegram chat as lead alerts; LEARNING_LOG_PAIRING_CODES logs them
 * instead, for local development, and is refused in production.
 */
function learningConfig(
  env: NodeJS.ProcessEnv,
  problems: string[],
): LearningModuleOptions | null {
  const tokenSecret = env['LEARNING_TOKEN_SECRET']?.trim() ?? '';
  const logPairingCodes = env['LEARNING_LOG_PAIRING_CODES']?.trim() === 'true';
  if (!tokenSecret) {
    if (logPairingCodes) {
      problems.push('LEARNING_LOG_PAIRING_CODES needs LEARNING_TOKEN_SECRET');
    }
    return null;
  }
  if (tokenSecret.length < MIN_SECRET_LENGTH) {
    problems.push(
      `LEARNING_TOKEN_SECRET needs at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  if (logPairingCodes && env['NODE_ENV'] === 'production') {
    problems.push('LEARNING_LOG_PAIRING_CODES is for development only');
  }
  const optional = (name: string) => env[name]?.trim() || null;
  return {
    tokenSecret,
    telegram: null,
    logPairingCodes,
    ai: {
      groq: optional('GROQ_API_KEY'),
      gemini: optional('GEMINI_API_KEY'),
      typesafe: optional('TYPESAFE_API_KEY'),
      n8n: n8nRelay(
        optional('LEARNING_N8N_URL'),
        optional('LEARNING_N8N_SECRET'),
        problems,
      ),
    },
    edgeUrl: edgeUrl(optional('LEARNING_EDGE_URL'), problems),
  };
}

/**
 * StudyLM cross-device sync shares Telegram pairing and falls back to
 * LEARNING_TOKEN_SECRET so Render deploys work without adding a new secret.
 */
function studylmConfig(
  env: NodeJS.ProcessEnv,
  problems: string[],
): StudyLmModuleOptions | null {
  const explicitSecret = env['STUDYLM_TOKEN_SECRET']?.trim() ?? '';
  const sharedSecret = env['LEARNING_TOKEN_SECRET']?.trim() ?? '';
  const tokenSecret = explicitSecret || sharedSecret;
  const logPairingCodes =
    env['STUDYLM_LOG_PAIRING_CODES']?.trim() === 'true' ||
    env['LEARNING_LOG_PAIRING_CODES']?.trim() === 'true';
  if (!tokenSecret) {
    if (logPairingCodes) {
      problems.push(
        'STUDYLM_LOG_PAIRING_CODES needs STUDYLM_TOKEN_SECRET or LEARNING_TOKEN_SECRET',
      );
    }
    return null;
  }
  if (explicitSecret && explicitSecret.length < MIN_SECRET_LENGTH) {
    problems.push(
      `STUDYLM_TOKEN_SECRET needs at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  if (
    env['STUDYLM_LOG_PAIRING_CODES']?.trim() === 'true' &&
    env['NODE_ENV'] === 'production'
  ) {
    problems.push('STUDYLM_LOG_PAIRING_CODES is for development only');
  }
  return {
    tokenSecret,
    telegram: null,
    logPairingCodes,
  };
}
