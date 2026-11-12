import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import {
  type HostAnswersResult,
  type HostCapturesResult,
  type HostLinked,
  type HostState,
  isHostApp,
} from '@ah/learning/contracts';
import {
  type Concept,
  type HostAnswersRequestBody,
  type HostCapturesRequestBody,
  type HostLinkRequestBody,
  hostCapture,
  hostCaptureId,
  hostProgress,
  hostReviewEvents,
  PAIRING,
  signDeviceToken,
  TOKEN_RENEW_WINDOW_MS,
} from '@ah/learning/domain';
import type { AuthenticatedHost } from './device.guard';
import type { LearningRepository } from './learning.repository';
import { WriteLock } from './write-lock';

/**
 * Linked hosts (design §9): a host app on its own origin can't open the
 * engine's database, so it sends cards, reports answers and reads progress
 * here, with a host token. Writes share the sync's WriteLock, so the change
 * feed stays in order.
 */
export class HostService {
  constructor(
    private readonly repository: LearningRepository,
    private readonly tokenSecret: string,
    private readonly now: () => Date = () => new Date(),
    private readonly lock: WriteLock = new WriteLock(),
    /** Called after new cards were stored, so the pipeline starts. */
    private readonly onCaptures: () => void = () => undefined,
  ) {}

  /** A paired device lets a host app in: a revocable link of its own. */
  async link(request: HostLinkRequestBody): Promise<HostLinked> {
    if (!isHostApp(request.app)) {
      throw new BadRequestException(
        'No app by that name can link to the Learning Engine.',
      );
    }
    const now = this.now();
    const hostId = randomUUID();
    const expiresAt = new Date(now.getTime() + PAIRING.tokenTtlMs);
    await this.repository.createDevice({
      id: hostId,
      name: request.name,
      host: request.app,
      pairedAt: now,
      lastSeenAt: null,
      revokedAt: null,
    });
    const token = await signDeviceToken(this.tokenSecret, {
      deviceId: hostId,
      expiresAt,
    });
    return { hostId, token, expiresAt: expiresAt.toISOString() };
  }

  /** The host unlinks itself ("Disconnect"). */
  async unlink(host: AuthenticatedHost): Promise<void> {
    await this.repository.revokeDevice(host.deviceId, this.now());
  }

  /**
   * Cards become captures, once each: the id comes from the card's source,
   * so a card sent again, from any device, or one the learner removed,
   * changes nothing.
   */
  async addCaptures(
    host: AuthenticatedHost,
    request: HostCapturesRequestBody,
  ): Promise<HostCapturesResult> {
    const result = await this.lock.run(async () => {
      let stored = 0;
      let known = 0;
      for (const item of request.items) {
        const id = await hostCaptureId(
          host.app,
          item.source.objectType,
          item.source.objectId,
        );
        if (await this.repository.getRecord('capture', id)) {
          known += 1;
          continue;
        }
        const capture = hostCapture({
          id,
          app: host.app,
          text: item.text,
          source: item.source,
          now: this.now(),
        });
        const outcome = await this.repository.putMutable({
          kind: 'capture',
          id,
          seq: await this.repository.nextSeq(),
          by: host.deviceId,
          updatedAt: capture.updatedAt,
          data: capture,
        });
        if (outcome === 'stored') stored += 1;
        else known += 1;
      }
      return { stored, known };
    });
    if (result.stored) this.onCaptures();
    return result;
  }

  /**
   * Answers in the host app become review events for the concepts their
   * card became, once those are in the reviews (hostReviewEvents).
   */
  async addAnswers(
    host: AuthenticatedHost,
    request: HostAnswersRequestBody,
  ): Promise<HostAnswersResult> {
    const now = this.now();
    return this.lock.run(async () => {
      let counted = 0;
      let skipped = 0;
      for (const answer of request.answers) {
        const captureId = await hostCaptureId(
          host.app,
          answer.objectType,
          answer.objectId,
        );
        const capture = await this.repository.getRecord('capture', captureId);
        const concepts: Concept[] = [];
        if (capture && !capture.data.deletedAt) {
          for (const id of capture.data.conceptIds) {
            const concept = await this.repository.getRecord('concept', id);
            if (concept) concepts.push(concept.data);
          }
        }
        const events = await hostReviewEvents({
          app: host.app,
          answer,
          concepts,
          timeZone: request.timeZone,
          now,
        });
        if (!events.length) {
          skipped += 1;
          continue;
        }
        for (const event of events) {
          await this.repository.putAppendOnly({
            kind: 'event',
            id: event.id,
            seq: await this.repository.nextSeq(),
            by: host.deviceId,
            updatedAt: event.at,
            data: event,
          });
        }
        counted += 1;
      }
      return { counted, skipped };
    });
  }

  /** The engine's progress for the host's stats. */
  async state(host: AuthenticatedHost, timeZone: string): Promise<HostState> {
    const now = this.now();
    const [captures, concepts, events, sessions] = await Promise.all([
      this.repository.recordsOfKind('capture'),
      this.repository.recordsOfKind('concept'),
      this.repository.recordsOfKind('event'),
      this.repository.recordsOfKind('session'),
    ]);
    const progress = hostProgress({
      app: host.app,
      captures: captures.map((record) => record.data),
      concepts: concepts.map((record) => record.data),
      events: events.map((record) => record.data),
      sessions: sessions.map((record) => record.data),
      timeZone,
      now,
    });
    return { ...progress, renewedToken: await this.renewal(host, now) };
  }

  /** A fresh token in the link's last 30 days, as sync does for devices. */
  private async renewal(
    host: AuthenticatedHost,
    now: Date,
  ): Promise<HostState['renewedToken']> {
    const left = host.tokenExpiresAt.getTime() - now.getTime();
    if (left > TOKEN_RENEW_WINDOW_MS) return null;
    const expiresAt = new Date(now.getTime() + PAIRING.tokenTtlMs);
    const token = await signDeviceToken(this.tokenSecret, {
      deviceId: host.deviceId,
      expiresAt,
    });
    return { token, expiresAt: expiresAt.toISOString() };
  }
}
