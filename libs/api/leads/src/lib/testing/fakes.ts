import type { LeadRequest } from '@ah/shared/contracts';
import type { LeadChannel } from '../channels';
import type { ChannelName, Lead } from '../lead';
import type { HumanVerifier, Verification } from '../human-verifier';

/** A channel that records what it sent and can be told to fail. */
export class FakeChannel implements LeadChannel {
  readonly sent: Lead[] = [];
  failWith: string | null = null;

  constructor(
    readonly name: ChannelName,
    readonly enabled = true,
  ) {}

  async send(lead: Lead): Promise<void> {
    if (this.failWith) {
      throw new Error(this.failWith);
    }
    this.sent.push(lead);
  }
}

export class FakeVerifier implements HumanVerifier {
  result: Verification = 'passed';
  async verify(): Promise<Verification> {
    return this.result;
  }
}

export function leadRequest(overrides: Partial<LeadRequest> = {}): LeadRequest {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'We are hiring a senior Angular developer.',
    intent: 'role',
    audience: 'recruiter',
    idempotencyKey: '7b7e2c5a-3f43-4c1e-9b6f-2c1d6e8f9a10',
    turnstileToken: 'token',
    ...overrides,
  };
}
