import * as v from 'valibot';
import {
  CaptureSchema,
  ConceptLinkSchema,
  ConceptSchema,
  ReviewSessionSchema,
  type RecordKind,
  type RecordOfKind,
  ReviewEventSchema,
  SettingsRecordSchema,
  TeachBackSchema,
  TopicSchema,
} from './records';

/**
 * The sync protocol (design §4.3): `POST /learning/sync`.
 *
 * The device pushes what it changed and pulls everything the server has
 * after its cursor. The server stamps each stored version with the device
 * that wrote it (`by`) and a sequence number (`seq`); the cursor is the
 * highest `seq` the device has seen. Pushing the same records twice
 * changes nothing, so a retry after a lost reply is always safe.
 */

export const SYNC_LIMITS = {
  pushTopics: 200,
  pushConcepts: 200,
  pushCaptures: 100,
  pushSessions: 100,
  pushEvents: 1000,
  pushTeachBacks: 200,
  pushLinks: 200,
  pushSettings: 10,
  /** Records per pull; `more` says another request is needed. */
  pull: 500,
} as const;

export const SyncRequestSchema = v.strictObject({
  cursor: v.pipe(v.number(), v.integer(), v.minValue(0)),
  push: v.strictObject({
    topics: v.pipe(v.array(TopicSchema), v.maxLength(SYNC_LIMITS.pushTopics)),
    concepts: v.pipe(
      v.array(ConceptSchema),
      v.maxLength(SYNC_LIMITS.pushConcepts),
    ),
    captures: v.pipe(
      v.array(CaptureSchema),
      v.maxLength(SYNC_LIMITS.pushCaptures),
    ),
    sessions: v.pipe(
      v.array(ReviewSessionSchema),
      v.maxLength(SYNC_LIMITS.pushSessions),
    ),
    events: v.pipe(
      v.array(ReviewEventSchema),
      v.maxLength(SYNC_LIMITS.pushEvents),
    ),
    /** Optional, so a device from before L5 still syncs. */
    links: v.optional(
      v.pipe(v.array(ConceptLinkSchema), v.maxLength(SYNC_LIMITS.pushLinks)),
      [],
    ),
    teachbacks: v.optional(
      v.pipe(v.array(TeachBackSchema), v.maxLength(SYNC_LIMITS.pushTeachBacks)),
      [],
    ),
    /** Optional, so older clients keep syncing seamlessly. */
    settings: v.optional(
      v.pipe(
        v.array(SettingsRecordSchema),
        v.maxLength(SYNC_LIMITS.pushSettings),
      ),
      [],
    ),
  }),
});

export type SyncRequest = v.InferOutput<typeof SyncRequestSchema>;

/** One stored version, as the server sends it back. */
export type PulledRecord = {
  [K in RecordKind]: {
    kind: K;
    seq: number;
    by: string;
    data: RecordOfKind[K];
  };
}[RecordKind];

export type RejectionReason = 'clock_ahead';

export interface Rejection {
  kind: RecordKind;
  id: string;
  reason: RejectionReason;
}

export interface SyncResponse {
  /** The highest `seq` in this reply, or the request's cursor. */
  cursor: number;
  /** More changes wait after `cursor`: sync again. */
  more: boolean;
  pull: PulledRecord[];
  rejected: Rejection[];
  serverTime: string;
  /**
   * A fresh token when the device's runs out within 30 days, so a device
   * that syncs now and then never has to pair again.
   */
  renewedToken: { token: string; expiresAt: string } | null;
}

/** When a token has this little time left, sync hands out a new one. */
export const TOKEN_RENEW_WINDOW_MS = 30 * 24 * 60 * 60_000;

export function emptyPush(): SyncRequest['push'] {
  return {
    topics: [],
    concepts: [],
    captures: [],
    sessions: [],
    events: [],
    links: [],
    teachbacks: [],
    settings: [],
  };
}
