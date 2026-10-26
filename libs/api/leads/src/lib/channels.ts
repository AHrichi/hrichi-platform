import { createHmac } from 'node:crypto';
import type { ChannelName, Lead } from './lead';

export const LEAD_CHANNELS = Symbol('LEAD_CHANNELS');

/** A place a stored lead is delivered to. `send` throws on failure. */
export interface LeadChannel {
  readonly name: ChannelName;
  readonly enabled: boolean;
  send(lead: Lead): Promise<void>;
}

type Fetch = typeof fetch;
const timeoutMs = 8000;

const intentLabels: Record<Lead['intent'], string> = {
  role: 'Job opportunity',
  project: 'Project enquiry',
  other: 'Message',
};

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** The alert text sent to Telegram (HTML parse mode). */
export function telegramMessage(lead: Lead): string {
  const header = [
    `<b>${escapeHtml(intentLabels[lead.intent])}</b> from the portfolio`,
    `${escapeHtml(lead.name)} &lt;${escapeHtml(lead.email)}&gt;`,
  ];
  if (lead.audience) {
    header.push(`Viewing as: ${lead.audience}`);
  }
  if (lead.humanCheck === 'unavailable') {
    header.push('⚠️ Turnstile was unreachable; human check not verified');
  }
  return `${header.join('\n')}\n\n${escapeHtml(lead.message.slice(0, 3500))}`;
}

/** Alerts you directly, so a lead is seen even when n8n is offline. */
export class TelegramChannel implements LeadChannel {
  readonly name = 'telegram' as const;
  readonly enabled: boolean;

  constructor(
    private readonly config: { botToken: string; chatId: string } | null,
    private readonly fetchFn: Fetch = fetch,
  ) {
    this.enabled = config !== null;
  }

  async send(lead: Lead): Promise<void> {
    if (!this.config) {
      throw new Error('Telegram is not configured');
    }
    const response = await this.fetchFn(
      `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: telegramMessage(lead),
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!response.ok) {
      throw new Error(`Telegram answered ${response.status}`);
    }
  }
}

/**
 * HMAC-SHA256 over `${timestamp}.${body}`. The n8n workflow recomputes it and
 * rejects requests that don't match or are older than five minutes.
 */
export function signPayload(
  secret: string,
  timestamp: string,
  body: string,
): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

/** Hands the lead to n8n for enrichment (AI summary, CRM row, auto-reply). */
export class N8nChannel implements LeadChannel {
  readonly name = 'n8n' as const;
  readonly enabled: boolean;

  constructor(
    private readonly config: { webhookUrl: string; secret: string } | null,
    private readonly fetchFn: Fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {
    this.enabled = config !== null;
  }

  async send(lead: Lead): Promise<void> {
    if (!this.config) {
      throw new Error('n8n is not configured');
    }
    const body = JSON.stringify({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      message: lead.message,
      intent: lead.intent,
      audience: lead.audience ?? null,
      humanCheck: lead.humanCheck,
      createdAt: lead.createdAt.toISOString(),
    });
    const timestamp = String(this.now());
    const response = await this.fetchFn(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lead-timestamp': timestamp,
        'x-lead-signature': `sha256=${signPayload(this.config.secret, timestamp, body)}`,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`n8n answered ${response.status}`);
    }
  }
}
