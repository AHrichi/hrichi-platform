import { Logger } from '@nestjs/common';

export const STUDYLM_PAIRING_NOTIFIER = Symbol('STUDYLM_PAIRING_NOTIFIER');

export interface StudyLmPairingNotifier {
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

export function studylmPairingMessage(
  deviceName: string,
  code: string,
): string {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  return [
    '📚 <b>StudyLM: pair a device</b>',
    `Code for “${escapeHtml(deviceName)}”: <code>${spaced}</code>`,
    'It works for 10 minutes. If you didn’t ask for it, ignore this message.',
  ].join('\n');
}

export class StudyLmTelegramPairingNotifier implements StudyLmPairingNotifier {
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
          text: studylmPairingMessage(deviceName, code),
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

export class StudyLmLogPairingNotifier implements StudyLmPairingNotifier {
  readonly enabled = true;
  private readonly logger = new Logger('StudyLmPairing');

  async sendCode(deviceName: string, code: string): Promise<void> {
    this.logger.warn(`StudyLM pairing code for "${deviceName}": ${code}`);
  }
}

export class FakeStudyLmPairingNotifier implements StudyLmPairingNotifier {
  enabled = true;
  readonly sent: Array<{ deviceName: string; code: string; expiresAt: Date }> =
    [];

  async sendCode(
    deviceName: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.enabled) throw new Error('Notifier disabled');
    this.sent.push({ deviceName, code, expiresAt });
  }
}
