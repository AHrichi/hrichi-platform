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
  idMax: 500,
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
  checks: Record<string, { answer?: unknown; correct: boolean }>;
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
  title: v.pipe(v.string(), v.maxLength(1000)),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  deletedAt: v.optional(v.nullable(IsoTimestampSchema)),
  sources: v.optional(
    v.array(
      v.looseObject({
        id: NonEmptyIdSchema,
        title: v.optional(v.string(), ''),
        type: v.optional(v.string(), 'note'),
        content: v.optional(v.string(), ''),
        addedAt: v.optional(v.string(), ''),
      }),
    ),
    [],
  ),
  overview: v.optional(v.nullable(v.looseObject({})), null),
  flashcards: v.optional(v.array(v.looseObject({})), []),
  quizQuestions: v.optional(v.array(v.looseObject({})), []),
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

const SyncedProgressSchema = v.looseObject({
  lessonId: NonEmptyIdSchema,
  steps: v.optional(
    // StepTimeline starts at -1 ("scene before the first step").
    v.record(v.string(), v.pipe(v.number(), v.integer(), v.minValue(-1))),
    {},
  ),
  checks: v.optional(
    v.record(
      v.string(),
      v.looseObject({
        answer: v.optional(v.unknown()),
        correct: v.boolean(),
      }),
    ),
    {},
  ),
  completedAt: v.optional(v.nullable(IsoTimestampSchema), null),
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clipStudyLmId(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed.slice(0, STUDYLM_SYNC_LIMITS.idMax);
  }
  return fallback.trim().slice(0, STUDYLM_SYNC_LIMITS.idMax) || 'item';
}

/** Returns `value` when it is a valid ISO timestamp within contract limits. */
export function normalizeStudyLmTimestamp(
  value: unknown,
  fallback: string,
): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64 || Number.isNaN(Date.parse(trimmed))) {
    return fallback;
  }
  return trimmed;
}

function normalizeDeletedAt(
  value: unknown,
  fallback: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return normalizeStudyLmTimestamp(value, fallback);
}

function normalizeIdList<T extends { id: string }>(
  raw: unknown,
  prefix: string,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    const obj = isPlainRecord(item) ? item : {};
    return {
      ...(obj as unknown as T),
      id: clipStudyLmId(obj['id'], `${prefix}-${i}`),
    };
  });
}

/**
 * Coerces legacy or partially migrated local IndexedDB records so they always
 * conform to `StudyLmSyncRequestSchema` before leaving the browser.
 */
export function normalizeStudyLmRecord<K extends StudyLmSyncKind>(
  kind: K,
  id: string,
  raw: unknown,
  fallbackIso: string,
): StudyLmSyncRecordOfKind[K] {
  const rec = isPlainRecord(raw) ? raw : {};
  const validFallback = normalizeStudyLmTimestamp(
    fallbackIso,
    new Date().toISOString(),
  );
  const updatedAt = normalizeStudyLmTimestamp(rec['updatedAt'], validFallback);

  switch (kind) {
    case 'subject': {
      const createdAt = normalizeStudyLmTimestamp(rec['createdAt'], updatedAt);
      const sourcesRaw = Array.isArray(rec['sources']) ? rec['sources'] : [];
      const normalized: SyncedSubjectRecord = {
        ...(rec as unknown as SyncedSubjectRecord),
        id: clipStudyLmId(rec['id'], id),
        title: String(rec['title'] ?? '').slice(0, 1000),
        createdAt,
        updatedAt,
        deletedAt: normalizeDeletedAt(rec['deletedAt'], updatedAt),
        sources: sourcesRaw.map((src, i) => {
          const s = isPlainRecord(src) ? src : {};
          return {
            ...(s as unknown as SyncedSubjectRecord['sources'][number]),
            id: clipStudyLmId(s['id'], `src-${i}`),
            title: String(s['title'] ?? ''),
            type: (String(s['type'] ?? 'note') ||
              'note') as SyncedSubjectRecord['sources'][number]['type'],
            content: String(s['content'] ?? ''),
            addedAt: String(s['addedAt'] ?? createdAt),
          };
        }),
        overview: isPlainRecord(rec['overview'])
          ? (rec['overview'] as unknown as SyncedSubjectRecord['overview'])
          : null,
        flashcards: normalizeIdList(rec['flashcards'], 'fc'),
        quizQuestions: normalizeIdList(rec['quizQuestions'], 'qz'),
      };
      return normalized as StudyLmSyncRecordOfKind[K];
    }
    case 'lesson': {
      const lessonId = clipStudyLmId(rec['id'], id);
      const lessonObj = isPlainRecord(rec['lesson']) ? rec['lesson'] : {};
      const normalized: SyncedGeneratedLessonRecord = {
        ...rec,
        id: lessonId,
        subjectId: clipStudyLmId(rec['subjectId'], 'subj-unknown'),
        sectionId: clipStudyLmId(rec['sectionId'], 'sec-unknown'),
        draft: isPlainRecord(rec['draft']) ? rec['draft'] : {},
        lesson: {
          ...lessonObj,
          id: clipStudyLmId(lessonObj['id'], lessonId),
          title: String(lessonObj['title'] ?? ''),
        },
        generatedAt: normalizeStudyLmTimestamp(rec['generatedAt'], updatedAt),
        updatedAt,
        deletedAt: normalizeDeletedAt(rec['deletedAt'], updatedAt),
      };
      return normalized as StudyLmSyncRecordOfKind[K];
    }
    case 'progress': {
      const steps: Record<string, number> = {};
      if (isPlainRecord(rec['steps'])) {
        for (const [k, v] of Object.entries(rec['steps'])) {
          if (typeof v === 'number' && Number.isFinite(v)) {
            steps[k] = Math.max(-1, Math.trunc(v));
          }
        }
      }
      const checks: Record<string, { answer?: unknown; correct: boolean }> = {};
      if (isPlainRecord(rec['checks'])) {
        for (const [k, v] of Object.entries(rec['checks'])) {
          if (isPlainRecord(v)) {
            checks[k] = {
              ...v,
              answer: v['answer'] ?? null,
              correct: Boolean(v['correct']),
            };
          }
        }
      }
      const normalized: SyncedLessonProgressRecord = {
        lessonId: clipStudyLmId(rec['lessonId'], id),
        steps,
        checks,
        completedAt:
          rec['completedAt'] === null || rec['completedAt'] === undefined
            ? null
            : normalizeStudyLmTimestamp(rec['completedAt'], updatedAt),
        updatedAt,
      };
      return normalized as StudyLmSyncRecordOfKind[K];
    }
    case 'setting': {
      const normalized: SyncedSettingRecord = {
        key: String(rec['key'] ?? id) as StudyLmSyncedSettingKey,
        value: rec['value'],
        updatedAt,
      };
      return normalized as StudyLmSyncRecordOfKind[K];
    }
  }
}
