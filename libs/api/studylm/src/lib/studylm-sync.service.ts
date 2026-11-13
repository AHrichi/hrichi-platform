import { signDeviceToken } from '@ah/learning/domain';
import {
  isStudyLmFutureTimestamp,
  STUDYLM_PAIRING,
  STUDYLM_SYNC_LIMITS,
  type StudyLmPulledRecord,
  type StudyLmSyncKind,
  type StudyLmSyncRejection,
  type StudyLmSyncRequest,
  type StudyLmSyncResponse,
  type StudyLmSyncRecordOfKind,
} from '@ah/products/studylm/domain';
import { StudyLmWriteLock } from './studylm-sync-helpers';
import type {
  StoredStudyLmRecord,
  StudyLmRepository,
} from './studylm.repository';

export interface StudyLmSyncCaller {
  deviceId: string;
  tokenExpiresAt: Date;
}

export class StudyLmSyncService {
  constructor(
    private readonly repository: StudyLmRepository,
    private readonly tokenSecret: string,
    private readonly now: () => Date = () => new Date(),
    private readonly lock: StudyLmWriteLock = new StudyLmWriteLock(),
  ) {}

  sync(
    caller: StudyLmSyncCaller,
    request: StudyLmSyncRequest,
  ): Promise<StudyLmSyncResponse> {
    return this.lock.run(() => this.run(caller, request));
  }

  private async run(
    caller: StudyLmSyncCaller,
    request: StudyLmSyncRequest,
  ): Promise<StudyLmSyncResponse> {
    const now = this.now();
    const rejected: StudyLmSyncRejection[] = [];
    const written = new Set<number>();

    const pushKind = async <K extends StudyLmSyncKind>(
      kind: K,
      items: readonly StudyLmSyncRecordOfKind[K][],
      idOf: (item: StudyLmSyncRecordOfKind[K]) => string,
    ) => {
      for (const data of items) {
        const id = idOf(data);
        if (isStudyLmFutureTimestamp(data.updatedAt, now)) {
          rejected.push({ kind, id, reason: 'clock_ahead' });
          continue;
        }
        const seq = await this.repository.nextSeq();
        const outcome = await this.repository.putRecord<K>({
          kind,
          id,
          seq,
          by: caller.deviceId,
          updatedAt: data.updatedAt,
          data,
        });
        if (outcome === 'stored') {
          written.add(seq);
        }
      }
    };

    await pushKind('subject', request.push.subjects, (s) => s.id);
    await pushKind('lesson', request.push.lessons, (l) => l.id);
    await pushKind('progress', request.push.progress, (p) => p.lessonId);
    await pushKind('setting', request.push.settings, (s) => s.key);

    const changes = await this.repository.changesSince(
      request.cursor,
      STUDYLM_SYNC_LIMITS.pull + 1,
    );
    const more = changes.length > STUDYLM_SYNC_LIMITS.pull;
    const page = more ? changes.slice(0, STUDYLM_SYNC_LIMITS.pull) : changes;
    const cursor = page.at(-1)?.seq ?? request.cursor;

    const pull = page
      .filter((record) => !written.has(record.seq))
      .map(toPulledRecord);

    const response: StudyLmSyncResponse = { cursor, pull, more, rejected };
    if (
      caller.tokenExpiresAt.getTime() - now.getTime() <=
      STUDYLM_PAIRING.tokenRenewWindowMs
    ) {
      const expiresAt = new Date(now.getTime() + STUDYLM_PAIRING.tokenTtlMs);
      response.renewedToken = {
        token: await signDeviceToken(this.tokenSecret, {
          deviceId: caller.deviceId,
          expiresAt,
        }),
        expiresAt: expiresAt.toISOString(),
      };
    }
    return response;
  }
}

function toPulledRecord(record: StoredStudyLmRecord): StudyLmPulledRecord {
  return {
    kind: record.kind,
    id: record.id,
    seq: record.seq,
    by: record.by,
    updatedAt: record.updatedAt,
    data: record.data,
  } as StudyLmPulledRecord;
}
