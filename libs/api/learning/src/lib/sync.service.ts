import {
  type Concept,
  CONCEPT_FIELD_GROUPS,
  type ConceptFieldRevisions,
  isFromTheFuture,
  mergeConcepts,
  type MutableKind,
  PAIRING,
  type PulledRecord,
  type Rejection,
  signDeviceToken,
  SYNC_LIMITS,
  type SyncRequest,
  type SyncResponse,
  TOKEN_RENEW_WINDOW_MS,
} from '@ah/learning/domain';
import type { LearningRepository, StoredRecord } from './learning.repository';
import { WriteLock } from './write-lock';

export interface SyncCaller {
  deviceId: string;
  tokenExpiresAt: Date;
}

/**
 * Applies a device's push, then returns what changed after its cursor
 * (design §4.3). Writes go through the shared WriteLock.
 */
export class SyncService {
  constructor(
    private readonly repository: LearningRepository,
    private readonly tokenSecret: string,
    private readonly now: () => Date = () => new Date(),
    private readonly lock: WriteLock = new WriteLock(),
    /** Called after a sync stored a capture, so the pipeline starts. */
    private readonly onCaptures: () => void = () => undefined,
  ) {}

  sync(caller: SyncCaller, request: SyncRequest): Promise<SyncResponse> {
    return this.lock.run(() => this.run(caller, request));
  }

  private async run(
    caller: SyncCaller,
    request: SyncRequest,
  ): Promise<SyncResponse> {
    const now = this.now();
    const rejected: Rejection[] = [];
    // Versions this request wrote; the device already has them.
    const written = new Set<number>();
    let capturesStored = false;

    const putMutable = async <K extends MutableKind>(
      kind: K,
      data: StoredRecord<K>['data'],
    ) => {
      if (isFromTheFuture(data.updatedAt, now)) {
        rejected.push({ kind, id: data.id, reason: 'clock_ahead' });
        return;
      }
      const seq = await this.repository.nextSeq();
      const outcome = await this.repository.putMutable<K>({
        kind,
        id: data.id,
        seq,
        by: caller.deviceId,
        updatedAt: data.updatedAt,
        data,
      } as StoredRecord<K>);
      if (outcome === 'stored') {
        written.add(seq);
        if (kind === 'capture') capturesStored = true;
      }
    };

    for (const topic of request.push.topics) await putMutable('topic', topic);
    for (const rawConcept of request.push.concepts) {
      if (isFromTheFuture(rawConcept.updatedAt, now)) {
        rejected.push({
          kind: 'concept',
          id: rawConcept.id,
          reason: 'clock_ahead',
        });
        continue;
      }
      const concept = normalizeIncomingConcept(rawConcept, caller.deviceId);
      const current = await this.repository.getRecord('concept', concept.id);
      if (!current) {
        await putMutable('concept', concept);
        continue;
      }
      const merged = mergeConcepts(
        { updatedAt: current.updatedAt, by: current.by, data: current.data },
        { updatedAt: concept.updatedAt, by: caller.deviceId, data: concept },
      );
      if (!merged.fromIncoming) continue;
      const seq = await this.repository.nextSeq();
      const outcome = await this.repository.putMergedConcept(
        {
          kind: 'concept',
          id: concept.id,
          seq,
          by: merged.by,
          updatedAt: merged.updatedAt,
          data: merged.concept,
        },
        current.seq,
      );
      if (outcome === 'stored' && !merged.keptCurrent) {
        written.add(seq);
      }
    }
    for (const capture of request.push.captures) {
      await putMutable('capture', capture);
    }
    for (const session of request.push.sessions) {
      await putMutable('session', session);
    }
    for (const link of request.push.links) await putMutable('link', link);
    for (const settings of request.push.settings ?? []) {
      await putMutable('settings', settings);
    }
    for (const event of request.push.events) {
      const seq = await this.repository.nextSeq();
      const outcome = await this.repository.putAppendOnly({
        kind: 'event',
        id: event.id,
        seq,
        by: caller.deviceId,
        updatedAt: event.at,
        data: event,
      });
      if (outcome === 'stored') written.add(seq);
    }
    for (const teachBack of request.push.teachbacks) {
      const seq = await this.repository.nextSeq();
      const outcome = await this.repository.putAppendOnly({
        kind: 'teachback',
        id: teachBack.id,
        seq,
        by: caller.deviceId,
        updatedAt: teachBack.at,
        data: teachBack,
      });
      if (outcome === 'stored') written.add(seq);
    }

    const changes = await this.repository.changesSince(
      request.cursor,
      SYNC_LIMITS.pull + 1,
    );
    const more = changes.length > SYNC_LIMITS.pull;
    const page = changes.slice(0, SYNC_LIMITS.pull);
    const cursor = page.length ? page[page.length - 1].seq : request.cursor;
    if (capturesStored) this.onCaptures();

    return {
      cursor,
      more,
      pull: page
        .filter((record) => !written.has(record.seq))
        .map(
          ({ kind, seq, by, data }) =>
            ({ kind, seq, by, data }) as PulledRecord,
        ),
      rejected,
      serverTime: now.toISOString(),
      renewedToken: await this.renewal(caller, now),
    };
  }

  private async renewal(
    caller: SyncCaller,
    now: Date,
  ): Promise<SyncResponse['renewedToken']> {
    const left = caller.tokenExpiresAt.getTime() - now.getTime();
    if (left > TOKEN_RENEW_WINDOW_MS) return null;
    const expiresAt = new Date(now.getTime() + PAIRING.tokenTtlMs);
    const token = await signDeviceToken(this.tokenSecret, {
      deviceId: caller.deviceId,
      expiresAt,
    });
    return { token, expiresAt: expiresAt.toISOString() };
  }
}

function normalizeIncomingConcept(concept: Concept, deviceId: string): Concept {
  if (!concept.fieldRevisions) return concept;
  const next: ConceptFieldRevisions = {};
  let changed = false;
  for (const group of CONCEPT_FIELD_GROUPS) {
    const rev = concept.fieldRevisions[group];
    if (!rev) continue;
    if (rev.by === 'local') {
      next[group] = { ...rev, by: deviceId };
      changed = true;
    } else {
      next[group] = rev;
    }
  }
  return changed ? { ...concept, fieldRevisions: next } : concept;
}
