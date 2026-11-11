import type { PairingNotifier } from '../pairing-notifier';

/** Keeps the codes it was asked to send, so a test can type one in. */
export class FakePairingNotifier implements PairingNotifier {
  readonly sent: { deviceName: string; code: string }[] = [];

  constructor(
    readonly enabled = true,
    private readonly fails = false,
  ) {}

  async sendCode(deviceName: string, code: string): Promise<void> {
    if (this.fails) throw new Error('Telegram is down');
    this.sent.push({ deviceName, code });
  }

  get lastCode(): string {
    const last = this.sent.at(-1);
    if (!last) throw new Error('No code was sent');
    return last.code;
  }
}
