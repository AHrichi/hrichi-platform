import { Logger } from '@nestjs/common';
import * as v from 'valibot';
import {
  type EdgeDevice,
  type EdgeRevocation,
  EdgeRevocationSchema,
  SERVER_TOKEN_SUBJECT,
  SERVER_TOKEN_TTL_MS,
  signDeviceToken,
} from '@ah/learning/domain';
import type { LearningRepository } from './learning.repository';

type Fetch = typeof fetch;

const RevocationsSchema = v.object({ revocations: v.array(v.unknown()) });

/**
 * Keeps the edge Worker's device list in sync with the API repository so
 * Telegram `/devices` and `/revoke` work when Render sleeps, and pulls pending
 * edge-side revocations back into MongoDB whenever the API wakes.
 */
export class EdgeDeviceSync {
  private readonly logger = new Logger(EdgeDeviceSync.name);
  private readonly base: string | null;

  constructor(
    private readonly options: { edgeUrl: string | null; tokenSecret: string },
    private readonly repository: LearningRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.base = options.edgeUrl?.replace(/\/+$/, '') || null;
  }

  get configured(): boolean {
    return !!this.base;
  }

  async pushDevices(): Promise<void> {
    if (!this.base) return;
    try {
      const devices: EdgeDevice[] = (await this.repository.listDevices()).map(
        (d) => ({
          id: d.id,
          name: d.name,
          host: d.host,
          pairedAt: d.pairedAt.toISOString(),
          lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
          revokedAt: d.revokedAt?.toISOString() ?? null,
        }),
      );
      const response = await this.fetchFn(`${this.base}/devices`, {
        method: 'PUT',
        headers: {
          ...(await this.authHeaders()),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ devices }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        this.logger.warn(`Edge /devices answered ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Could not sync devices to edge: ${String(error)}`);
    }
  }

  async pullRevocations(): Promise<number> {
    if (!this.base) return 0;
    const headers = await this.authHeaders();
    const response = await this.fetchFn(`${this.base}/revocations`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(
        `The edge Worker revocations answered ${response.status}`,
      );
    }
    const body = v.safeParse(RevocationsSchema, await response.json());
    if (!body.success) {
      throw new Error('The edge revocations reply is malformed.');
    }
    const done: string[] = [];
    for (const raw of body.output.revocations) {
      const parsed = v.safeParse(EdgeRevocationSchema, raw);
      if (!parsed.success) continue;
      const item: EdgeRevocation = parsed.output;
      await this.repository.revokeDevice(
        item.deviceId,
        new Date(item.revokedAt),
      );
      done.push(item.key);
    }
    if (done.length) {
      const ack = await this.fetchFn(`${this.base}/revocations/ack`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ keys: done }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!ack.ok) throw new Error(`Revocation ack answered ${ack.status}`);
    }
    return done.length;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await signDeviceToken(this.options.tokenSecret, {
      deviceId: SERVER_TOKEN_SUBJECT,
      expiresAt: new Date(this.now().getTime() + SERVER_TOKEN_TTL_MS),
    });
    return { authorization: `Bearer ${token}` };
  }
}
