import * as v from 'valibot';
import type { StudySubject } from './subject.model';

/** Origins where standalone StudyLM runs and talks to the sync backend. */
export const STUDYLM_ORIGINS = [
  'https://product-studylm.ahmed-hrichi.workers.dev',
  'http://localhost:4307',
] as const;

export const STUDYLM_PAIRING = {
  codeLength: 6,
  ttlMs: 10 * 60_000,
  maxAttempts: 5,
  deviceNameMax: 40,
  tokenTtlMs: 180 * 24 * 60 * 60_000,
  tokenRenewWindowMs: 30 * 24 * 60 * 60_000,
} as const;

export const STUDYLM_SYNC_LIMITS = {
  subjects: 20,
  lessons: 20,
  progress: 100,
  settings: 20,
  /** Pulled records per round; `more` asks the client for another round. */
  pull: 50,
  idMax: 200,
} as const;

export const STUDYLM_CLOCK_SKEW_MS = 5 * 60_000;

/** Settings synced across StudyLM devices (n8n endpoints stay per-device). */
export const STUDYLM_SYNC_SETTING_KEYS = ['activeSubjectId'] as const;
export type StudyLmSyncedSettingKey =
  (typeof STUDYLM_SYNC_SETTING_KEYS)[number];

export type StudyLmSyncKind = 'subject' | 'lesson' | 'progress' | 'setting';

export interface SyncedSubjectRecord extends StudySubject {
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SyncedGeneratedLessonRecord<
  TLesson = Record<string, unknown>,
  TDraft = Record<string, unknown>,
> {
  id: string;
  subjectId: string;
  sectionId: string;
  draft: TDraft;
  lesson: TLesson;
  generatedAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SyncedLessonProgressRecord {
  lessonId: string;
  steps: Record<string, number>;
  checks: Record<string, { answer: unknown; correct: boolean }>;
  completedAt: string | null;
  updatedAt: string;
}

export interface SyncedSettingRecord {
  key: StudyLmSyncedSettingKey;
  value: unknown;
  updatedAt: string;
}

export interface StudyLmSyncRecordOfKind {
  subject: SyncedSubjectRecord;
  lesson: SyncedGeneratedLessonRecord;
  progress: SyncedLessonProgressRecord;
  setting: SyncedSettingRecord;
}

export interface StudyLmSyncPush {
  subjects: SyncedSubjectRecord[];
  lessons: SyncedGeneratedLessonRecord[];
  progress: SyncedLessonProgressRecord[];
  settings: SyncedSettingRecord[];
}

export interface StudyLmSyncRequest {
  cursor: number;
  push: StudyLmSyncPush;
}

export type StudyLmPulledRecord = {
  [K in StudyLmSyncKind]: {
    kind: K;
    id: string;
    seq: number;
    by: string;
    updatedAt: string;
    data: StudyLmSyncRecordOfKind[K];
  };
}[StudyLmSyncKind];

export type StudyLmRejectionReason = 'clock_ahead';

export interface StudyLmSyncRejection {
  kind: StudyLmSyncKind;
  id: string;
  reason: StudyLmRejectionReason;
}

export interface StudyLmSyncResponse {
  cursor: number;
  pull: StudyLmPulledRecord[];
  more: boolean;
  rejected: StudyLmSyncRejection[];
  renewedToken?: {
    token: string;
    expiresAt: string;
  };
}

export interface StudyLmPairingStart {
  deviceName: string;
}

export interface StudyLmPairingStarted {
  pairingId: string;
  expiresAt: string;
}

export interface StudyLmPairingConfirm {
  code: string;
}

export interface StudyLmDevicePaired {
  deviceId: string;
  deviceName: string;
  token: string;
  expiresAt: string;
}

export interface StudyLmDeviceSummary {
  id: string;
  name: string;
  pairedAt: string;
  lastSeenAt: string | null;
  current: boolean;
}

const NonEmptyIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(STUDYLM_SYNC_LIMITS.idMax),
);

const IsoTimestampSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(64),
  v.check(
    (value) => !Number.isNaN(Date.parse(value)),
    'Expected ISO timestamp',
  ),
);

export const StudyLmPairingStartSchema = v.strictObject({
  deviceName: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(STUDYLM_PAIRING.deviceNameMax),
  ),
});

export const StudyLmPairingConfirmSchema = v.strictObject({
  code: v.pipe(v.string(), v.regex(/^\d{6}$/)),
});

const SyncedSubjectSchema = v.looseObject({
  id: NonEmptyIdSchema,
  title: v.pipe(v.string(), v.maxLength(500)),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  deletedAt: v.optional(v.nullable(IsoTimestampSchema)),
  sources: v.array(
    v.looseObject({
      id: NonEmptyIdSchema,
      title: v.string(),
      type: v.string(),
      content: v.string(),
      addedAt: v.string(),
    }),
  ),
  overview: v.nullable(v.looseObject({})),
  flashcards: v.array(v.looseObject({ id: NonEmptyIdSchema })),
  quizQuestions: v.array(v.looseObject({ id: NonEmptyIdSchema })),
});

const SyncedLessonSchema = v.looseObject({
  id: NonEmptyIdSchema,
  subjectId: NonEmptyIdSchema,
  sectionId: NonEmptyIdSchema,
  draft: v.looseObject({}),
  lesson: v.looseObject({
    id: NonEmptyIdSchema,
    title: v.string(),
  }),
  generatedAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  deletedAt: v.optional(v.nullable(IsoTimestampSchema)),
});

const SyncedProgressSchema = v.strictObject({
  lessonId: NonEmptyIdSchema,
  steps: v.record(v.string(), v.pipe(v.number(), v.integer(), v.minValue(0))),
  checks: v.record(
    v.string(),
    v.strictObject({
      answer: v.unknown(),
      correct: v.boolean(),
    }),
  ),
  completedAt: v.nullable(IsoTimestampSchema),
  updatedAt: IsoTimestampSchema,
});

const SyncedSettingSchema = v.strictObject({
  key: v.picklist(STUDYLM_SYNC_SETTING_KEYS),
  value: v.unknown(),
  updatedAt: IsoTimestampSchema,
});

export const StudyLmSyncRequestSchema = v.strictObject({
  cursor: v.pipe(v.number(), v.integer(), v.minValue(0)),
  push: v.strictObject({
    subjects: v.pipe(
      v.array(SyncedSubjectSchema),
      v.maxLength(STUDYLM_SYNC_LIMITS.subjects),
    ),
    lessons: v.pipe(
      v.array(SyncedLessonSchema),
      v.maxLength(STUDYLM_SYNC_LIMITS.lessons),
    ),
    progress: v.pipe(
      v.array(SyncedProgressSchema),
      v.maxLength(STUDYLM_SYNC_LIMITS.progress),
    ),
    settings: v.pipe(
      v.array(SyncedSettingSchema),
      v.maxLength(STUDYLM_SYNC_LIMITS.settings),
    ),
  }),
});

export function emptyStudyLmPush(): StudyLmSyncPush {
  return { subjects: [], lessons: [], progress: [], settings: [] };
}

export function isSyncedSettingKey(
  key: string,
): key is StudyLmSyncedSettingKey {
  return (STUDYLM_SYNC_SETTING_KEYS as readonly string[]).includes(key);
}

/**
 * Last-writer-wins comparison using parsed epoch milliseconds so timestamps
 * with different UTC offsets compare chronologically, with writer id tie-break.
 */
export function incomingStudyLmWins(
  current: { updatedAt: string; by: string } | null | undefined,
  incoming: { updatedAt: string; by: string },
): boolean {
  if (!current) return true;
  const currentMs = Date.parse(current.updatedAt);
  const incomingMs = Date.parse(incoming.updatedAt);
  if (Number.isNaN(currentMs)) return true;
  if (Number.isNaN(incomingMs)) return false;
  if (incomingMs !== currentMs) return incomingMs > currentMs;
  return incoming.by > current.by;
}

export function isStudyLmFutureTimestamp(
  updatedAt: string,
  now: Date,
): boolean {
  const ms = Date.parse(updatedAt);
  if (Number.isNaN(ms)) return true;
  return ms - now.getTime() > STUDYLM_CLOCK_SKEW_MS;
}
