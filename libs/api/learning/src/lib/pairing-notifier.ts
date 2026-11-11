import { Logger } from '@nestjs/common';

export const PAIRING_NOTIFIER = Symbol('PAIRING_NOTIFIER');

/** Where a pairing code goes: never back to the device that asked. */
export interface PairingNotifier {
  readonly enabled: boolean;
  sendCode(deviceName: string, code: string, expiresAt: Date): Promise<void>;
}

type Fetch = typeof fetch;

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function pairingMessage(deviceName: string, code: string): string {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  return [
    '🔐 <b>Learning Engine: pair a device</b>',
    `Code for “${escapeHtml(deviceName)}”: <code>${spaced}</code>`,
    'It works for 10 minutes. If you didn’t ask for it, ignore this message.',
  ].join('\n');
}

/** Sends the code to the owner's Telegram chat (the bot the leads use). */
export class TelegramPairingNotifier implements PairingNotifier {
  readonly enabled: boolean;

  constructor(
    private readonly config: { botToken: string; chatId: string } | null,
    private readonly fetchFn: Fetch = fetch,
  ) {
    this.enabled = config !== null;
  }

  async sendCode(deviceName: string, code: string): Promise<void> {
    if (!this.config) throw new Error('Telegram is not configured');
    const response = await this.fetchFn(
      `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: pairingMessage(deviceName, code),
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) {
      throw new Error(`Telegram answered ${response.status}`);
    }
  }
}

/**
 * For local development without a bot: the code goes to the API's log.
 * Config refuses it in production.
 */
export class LogPairingNotifier implements PairingNotifier {
  readonly enabled = true;
  private readonly logger = new Logger('LearningPairing');

  async sendCode(deviceName: string, code: string): Promise<void> {
    this.logger.warn(`Pairing code for "${deviceName}": ${code}`);
  }
}
