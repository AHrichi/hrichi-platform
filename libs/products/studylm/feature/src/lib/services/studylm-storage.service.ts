import { inject, Injectable, signal } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import {
  emptyStudyLmPush,
  incomingStudyLmWins,
  isSyncedSettingKey,
  STUDYLM_SYNC_LIMITS,
  type StudyLmPulledRecord,
  type StudyLmSyncKind,
  type StudyLmSyncPush,
  type StudyLmSyncRecordOfKind,
  type StudySubject,
  type SyncedGeneratedLessonRecord,
  type SyncedSubjectRecord,
} from '@ah/products/studylm/domain';
import type { Lesson } from '@ah/products/studylm/lessons';
import type { LessonDraft } from './lesson-generator';

export interface StudyLmSettingRecord {
  key: string;
  value: unknown;
}

/** How far a learner got in one lesson, saved as they go. */
export interface LessonProgress {
  lessonId: string;
  /** The step each stepped block was left on. */
  steps: Record<string, number>;
  /** Each check's answer, and whether it was right. */
  checks: Record<string, { answer: unknown; correct: boolean }>;
  completedAt: string | null;
  updatedAt: string;
}

/** A lesson the AI wrote for one roadmap section, and how it was written. */
export interface GeneratedLessonRecord {
  /** `gen-…`, from the subject and section (lessonIdFor). */
  id: string;
  subjectId: string;
  /** The roadmap section it was written for. */
  sectionId: string;
  draft: LessonDraft;
  lesson: Lesson;
  generatedAt: string;
}

export interface StudyLmSyncSession {
  deviceId: string;
  deviceName: string;
  token: string;
  expiresAt: string;
}

export interface StudyLmSyncStateRecord {
  key: 'session' | 'cursor' | 'lastSyncAt' | 'backfilled';
  value: unknown;
}

export interface StudyLmOutboxRecord<
  K extends StudyLmSyncKind = StudyLmSyncKind,
> {
  /** `<kind>:<id>` */
  key: string;
  kind: K;
  id: string;
  updatedAt: string;
  data: StudyLmSyncRecordOfKind[K];
}

export interface StudyLmSyncMetaRecord {
  /** `<kind>:<id>` */
  key: string;
  updatedAt: string;
  by: string;
}

export interface StudyLmWriteOptions {
  fromSync?: boolean;
  now?: string;
}

export interface StudyLmOutboxBatch {
  push: StudyLmSyncPush;
  acknowledged: Array<{ key: string; updatedAt: string }>;
  remaining: number;
}

export interface StudyLmPullApplied {
  subjectsChanged: boolean;
  lessonsChanged: boolean;
  progressChanged: boolean;
  settingsChanged: boolean;
  pulledLessonIds: string[];
  appliedCount: number;
}

const DEFAULT_MAX_BATCH_BYTES = 450_000;

export class StudyLmDatabase extends Dexie {
  subjects!: Table<StudySubject, string>;
  settings!: Table<StudyLmSettingRecord, string>;
  lessonProgress!: Table<LessonProgress, string>;
  lessons!: Table<GeneratedLessonRecord, string>;
  syncState!: Table<StudyLmSyncStateRecord, string>;
  syncOutbox!: Table<StudyLmOutboxRecord, string>;
  syncMeta!: Table<StudyLmSyncMetaRecord, string>;

  constructor(name = 'StudyLmDatabase') {
    super(name);
    this.version(1).stores({
      subjects: 'id, title, domain, createdAt',
      settings: 'key',
    });
    // Version 2 adds lesson progress; subjects and settings are unchanged.
    this.version(2).stores({ lessonProgress: 'lessonId' });
    // Version 3 adds the lessons the AI writes.
    this.version(3).stores({ lessons: 'id, subjectId' });
    // Version 4 adds sync state, outbox, and version metadata.
    this.version(4).stores({
      syncState: 'key',
      syncOutbox: 'key, kind, id',
      syncMeta: 'key',
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class StudyLmStorageService {
  private readonly mode = inject(APP_MODE, { optional: true }) ?? 'standalone';
  private database: Promise<StudyLmDatabase | null> | null = null;
  private readonly memorySubjects = new Map<string, StudySubject>();
  private readonly memorySettings = new Map<string, unknown>();
  private readonly memoryProgress = new Map<string, LessonProgress>();
  private readonly memoryLessons = new Map<string, GeneratedLessonRecord>();
  private readonly memorySyncState = new Map<string, unknown>();
  private readonly memoryOutbox = new Map<string, StudyLmOutboxRecord>();
  private readonly memorySyncMeta = new Map<string, StudyLmSyncMetaRecord>();

  /** Increments on local mutations in standalone mode to trigger debounced sync. */
  readonly localChangeRevision = signal(0);

  /** The portfolio's demo keeps its own database (see databaseName). */
  private open(): Promise<StudyLmDatabase | null> {
    this.database ??=
      typeof indexedDB === 'undefined'
        ? Promise.resolve(null)
        : databaseName(this.mode, 'studylm', 'StudyLmDatabase').then(
            (name) => new StudyLmDatabase(name),
            () => null,
          );
    return this.database;
  }

  private get tracksSync(): boolean {
    return this.mode === 'standalone';
  }

  private bumpLocalChange(): void {
    this.localChangeRevision.update((n) => n + 1);
  }

  private async enqueueOutbox<K extends StudyLmSyncKind>(
    kind: K,
    id: string,
    updatedAt: string,
    data: StudyLmSyncRecordOfKind[K],
  ): Promise<void> {
    if (!this.tracksSync) return;
    const key = `${kind}:${id}`;
    const entry: StudyLmOutboxRecord<K> = { key, kind, id, updatedAt, data };
    const meta: StudyLmSyncMetaRecord = { key, updatedAt, by: 'local' };
    this.memoryOutbox.set(key, entry);
    this.memorySyncMeta.set(key, meta);
    const db = await this.open();
    if (db) {
      try {
        await db.syncOutbox.put(entry);
        await db.syncMeta.put(meta);
      } catch {
        // Fallback to in-memory outbox silently
      }
    }
    this.bumpLocalChange();
  }

  async getAllSubjects(): Promise<StudySubject[]> {
    const db = await this.open();
    if (!db) {
      return Array.from(this.memorySubjects.values());
    }
    try {
      return await db.subjects.toArray();
    } catch {
      return Array.from(this.memorySubjects.values());
    }
  }

  async getSubject(id: string): Promise<StudySubject | null> {
    const db = await this.open();
    if (!db) {
      return this.memorySubjects.get(id) ?? null;
    }
    try {
      const subject = await db.subjects.get(id);
      return subject ?? null;
    } catch {
      return this.memorySubjects.get(id) ?? null;
    }
  }

  async saveSubject(
    subject: StudySubject,
    options?: StudyLmWriteOptions,
  ): Promise<void> {
    this.memorySubjects.set(subject.id, subject);
    const db = await this.open();
    if (db) {
      try {
        await db.subjects.put(subject);
      } catch {
        // Fallback to in-memory silently
      }
    }
    if (this.tracksSync && !options?.fromSync) {
      const nowIso = options?.now ?? new Date().toISOString();
      await this.enqueueOutbox('subject', subject.id, nowIso, {
        ...subject,
        updatedAt: nowIso,
        deletedAt: null,
      });
    }
  }

  async deleteSubject(
    id: string,
    options?: StudyLmWriteOptions,
  ): Promise<void> {
    const existing =
      this.tracksSync && !options?.fromSync ? await this.getSubject(id) : null;
    this.memorySubjects.delete(id);
    const db = await this.open();
    if (db) {
      try {
        await db.subjects.delete(id);
      } catch {
        // Fallback silently
      }
    }
    if (this.tracksSync && !options?.fromSync) {
      const nowIso = options?.now ?? new Date().toISOString();
      await this.enqueueOutbox('subject', id, nowIso, {
        id,
        title: existing?.title ?? 'Deleted Subject',
        sources: [],
        overview: null,
        flashcards: [],
        quizQuestions: [],
        createdAt: existing?.createdAt ?? nowIso,
        updatedAt: nowIso,
        deletedAt: nowIso,
      });
    }
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const db = await this.open();
    if (!db) {
      return (this.memorySettings.get(key) as T) ?? null;
    }
    try {
      const record = await db.settings.get(key);
      return (record?.value as T) ?? null;
    } catch {
      return (this.memorySettings.get(key) as T) ?? null;
    }
  }

  async saveSetting(
    key: string,
    value: unknown,
    options?: StudyLmWriteOptions,
  ): Promise<void> {
    this.memorySettings.set(key, value);
    const db = await this.open();
    if (db) {
      try {
        await db.settings.put({ key, value });
      } catch {
        // Fallback silently
      }
    }
    if (this.tracksSync && !options?.fromSync && isSyncedSettingKey(key)) {
      const nowIso = options?.now ?? new Date().toISOString();
      await this.enqueueOutbox('setting', key, nowIso, {
        key,
        value,
        updatedAt: nowIso,
      });
    }
  }

  async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    const db = await this.open();
    try {
      return (
        (db ? await db.lessonProgress.get(lessonId) : undefined) ??
        this.memoryProgress.get(lessonId) ??
        null
      );
    } catch {
      return this.memoryProgress.get(lessonId) ?? null;
    }
  }

  async getAllLessonProgress(): Promise<LessonProgress[]> {
    const db = await this.open();
    try {
      return db
        ? await db.lessonProgress.toArray()
        : Array.from(this.memoryProgress.values());
    } catch {
      return Array.from(this.memoryProgress.values());
    }
  }

  async saveLessonProgress(
    progress: LessonProgress,
    options?: StudyLmWriteOptions,
  ): Promise<void> {
    this.memoryProgress.set(progress.lessonId, progress);
    const db = await this.open();
    if (db) {
      try {
        await db.lessonProgress.put(progress);
      } catch {
        // Kept in memory for this visit
      }
    }
    if (this.tracksSync && !options?.fromSync) {
      await this.enqueueOutbox(
        'progress',
        progress.lessonId,
        progress.updatedAt,
        progress,
      );
    }
  }

  async getGeneratedLesson(id: string): Promise<GeneratedLessonRecord | null> {
    const db = await this.open();
    try {
      return (
        (db ? await db.lessons.get(id) : undefined) ??
        this.memoryLessons.get(id) ??
        null
      );
    } catch {
      return this.memoryLessons.get(id) ?? null;
    }
  }

  async listGeneratedLessons(): Promise<GeneratedLessonRecord[]> {
    const db = await this.open();
    try {
      return db
        ? await db.lessons.toArray()
        : Array.from(this.memoryLessons.values());
    } catch {
      return Array.from(this.memoryLessons.values());
    }
  }

  async saveGeneratedLesson(
    record: GeneratedLessonRecord,
    options?: StudyLmWriteOptions,
  ): Promise<void> {
    this.memoryLessons.set(record.id, record);
    const db = await this.open();
    if (db) {
      try {
        await db.lessons.put(record);
      } catch {
        // Kept in memory for this visit
      }
    }
    if (this.tracksSync && !options?.fromSync) {
      const nowIso = options?.now ?? new Date().toISOString();
      await this.enqueueOutbox('lesson', record.id, nowIso, {
        id: record.id,
        subjectId: record.subjectId,
        sectionId: record.sectionId,
        draft: record.draft as unknown as Record<string, unknown>,
        lesson: record.lesson as unknown as Record<string, unknown>,
        generatedAt: record.generatedAt,
        updatedAt: nowIso,
        deletedAt: null,
      });
    }
  }

  async deleteGeneratedLessons(
    subjectId: string,
    options?: StudyLmWriteOptions,
  ): Promise<void> {
    const db = await this.open();
    let existing: GeneratedLessonRecord[] = [];
    if (this.tracksSync && !options?.fromSync) {
      if (db) {
        try {
          existing = await db.lessons
            .where('subjectId')
            .equals(subjectId)
            .toArray();
        } catch {
          existing = Array.from(this.memoryLessons.values()).filter(
            (r) => r.subjectId === subjectId,
          );
        }
      } else {
        existing = Array.from(this.memoryLessons.values()).filter(
          (r) => r.subjectId === subjectId,
        );
      }
    }
    for (const [id, record] of this.memoryLessons) {
      if (record.subjectId === subjectId) this.memoryLessons.delete(id);
    }
    if (db) {
      try {
        await db.lessons.where('subjectId').equals(subjectId).delete();
      } catch {
        // Nothing else to do
      }
    }
    if (this.tracksSync && !options?.fromSync && existing.length > 0) {
      const nowIso = options?.now ?? new Date().toISOString();
      for (const r of existing) {
        await this.enqueueOutbox('lesson', r.id, nowIso, {
          id: r.id,
          subjectId: r.subjectId,
          sectionId: r.sectionId,
          draft: {},
          lesson: { id: r.lesson.id, title: r.lesson.title },
          generatedAt: r.generatedAt,
          updatedAt: nowIso,
          deletedAt: nowIso,
        });
      }
    }
  }

  private async getStateValue<T>(
    key: StudyLmSyncStateRecord['key'],
  ): Promise<T | null> {
    const db = await this.open();
    if (!db) return (this.memorySyncState.get(key) as T) ?? null;
    try {
      const row = await db.syncState.get(key);
      return (row?.value as T) ?? (this.memorySyncState.get(key) as T) ?? null;
    } catch {
      return (this.memorySyncState.get(key) as T) ?? null;
    }
  }

  private async setStateValue(
    key: StudyLmSyncStateRecord['key'],
    value: unknown,
  ): Promise<void> {
    this.memorySyncState.set(key, value);
    const db = await this.open();
    if (db) {
      try {
        await db.syncState.put({ key, value });
      } catch {
        // In-memory fallback stays active
      }
    }
  }

  getSyncSession(): Promise<StudyLmSyncSession | null> {
    return this.getStateValue<StudyLmSyncSession>('session');
  }

  setSyncSession(session: StudyLmSyncSession): Promise<void> {
    return this.setStateValue('session', session);
  }

  async clearSyncSession(): Promise<void> {
    this.memorySyncState.delete('session');
    this.memorySyncState.set('cursor', 0);
    this.memorySyncState.set('backfilled', false);
    const db = await this.open();
    if (db) {
      try {
        await db.syncState.delete('session');
        await db.syncState.put({ key: 'cursor', value: 0 });
        await db.syncState.put({ key: 'backfilled', value: false });
      } catch {
        // Ignore storage failure
      }
    }
  }

  async getSyncCursor(): Promise<number> {
    return (await this.getStateValue<number>('cursor')) ?? 0;
  }

  setSyncCursor(cursor: number): Promise<void> {
    return this.setStateValue('cursor', cursor);
  }

  getLastSyncAt(): Promise<string | null> {
    return this.getStateValue<string>('lastSyncAt');
  }

  setLastSyncAt(iso: string): Promise<void> {
    return this.setStateValue('lastSyncAt', iso);
  }

  /**
   * Queues local records created before Cloud Sync was enabled so an existing
   * device uploads all subjects, generated lessons, and progress on first pair.
   */
  async enqueueExistingForSync(
    nowIso = new Date().toISOString(),
  ): Promise<void> {
    if (!this.tracksSync) return;
    if (await this.getStateValue<boolean>('backfilled')) return;

    const db = await this.open();
    const existingMeta = new Set<string>(this.memorySyncMeta.keys());
    const existingOutbox = new Set<string>(this.memoryOutbox.keys());
    if (db) {
      try {
        for (const m of await db.syncMeta.toArray()) existingMeta.add(m.key);
        for (const o of await db.syncOutbox.toArray())
          existingOutbox.add(o.key);
      } catch {
        // Continue with in-memory view
      }
    }

    const needsQueue = (kind: StudyLmSyncKind, id: string) => {
      const key = `${kind}:${id}`;
      return !existingMeta.has(key) && !existingOutbox.has(key);
    };

    const [subjects, lessons, progressList, activeSubjectId] =
      await Promise.all([
        this.getAllSubjects(),
        this.listGeneratedLessons(),
        this.getAllLessonProgress(),
        this.getSetting<string>('activeSubjectId'),
      ]);

    for (const subject of subjects) {
      if (!needsQueue('subject', subject.id)) continue;
      const updatedAt = safeTimestamp(
        subject.lastSynthesizedAt ?? subject.createdAt,
        nowIso,
      );
      await this.putInitialOutbox('subject', subject.id, updatedAt, {
        ...subject,
        updatedAt,
        deletedAt: null,
      });
    }
    for (const lesson of lessons) {
      if (!needsQueue('lesson', lesson.id)) continue;
      const updatedAt = safeTimestamp(lesson.generatedAt, nowIso);
      await this.putInitialOutbox('lesson', lesson.id, updatedAt, {
        id: lesson.id,
        subjectId: lesson.subjectId,
        sectionId: lesson.sectionId,
        draft: lesson.draft as unknown as Record<string, unknown>,
        lesson: lesson.lesson as unknown as Record<string, unknown>,
        generatedAt: safeTimestamp(lesson.generatedAt, nowIso),
        updatedAt,
        deletedAt: null,
      });
    }
    for (const progress of progressList) {
      if (!needsQueue('progress', progress.lessonId)) continue;
      const updatedAt = safeTimestamp(progress.updatedAt, nowIso);
      await this.putInitialOutbox('progress', progress.lessonId, updatedAt, {
        ...progress,
        updatedAt,
      });
    }
    if (
      activeSubjectId &&
      subjects.some((s) => s.id === activeSubjectId) &&
      needsQueue('setting', 'activeSubjectId')
    ) {
      await this.putInitialOutbox('setting', 'activeSubjectId', nowIso, {
        key: 'activeSubjectId',
        value: activeSubjectId,
        updatedAt: nowIso,
      });
    }

    await this.setStateValue('backfilled', true);
  }

  private async putInitialOutbox<K extends StudyLmSyncKind>(
    kind: K,
    id: string,
    updatedAt: string,
    data: StudyLmSyncRecordOfKind[K],
  ): Promise<void> {
    const key = `${kind}:${id}`;
    const entry: StudyLmOutboxRecord<K> = { key, kind, id, updatedAt, data };
    const meta: StudyLmSyncMetaRecord = { key, updatedAt, by: 'local' };
    this.memoryOutbox.set(key, entry);
    this.memorySyncMeta.set(key, meta);
    const db = await this.open();
    if (db) {
      try {
        await db.syncOutbox.put(entry);
        await db.syncMeta.put(meta);
      } catch {
        // Fallback silently
      }
    }
  }

  async readOutboxBatch(
    maxBytes = DEFAULT_MAX_BATCH_BYTES,
  ): Promise<StudyLmOutboxBatch> {
    const db = await this.open();
    let entries: StudyLmOutboxRecord[] = Array.from(this.memoryOutbox.values());
    if (db) {
      try {
        entries = await db.syncOutbox.toArray();
      } catch {
        entries = Array.from(this.memoryOutbox.values());
      }
    }

    // Order subjects before lessons before progress/settings so new devices
    // see parent subjects early during incremental syncing.
    const order: Record<StudyLmSyncKind, number> = {
      subject: 0,
      lesson: 1,
      progress: 2,
      setting: 3,
    };
    entries.sort((a, b) => order[a.kind] - order[b.kind]);

    const push = emptyStudyLmPush();
    const acknowledged: Array<{ key: string; updatedAt: string }> = [];
    let totalBytes = 0;

    for (const entry of entries) {
      const limitForKind =
        entry.kind === 'subject'
          ? STUDYLM_SYNC_LIMITS.subjects
          : entry.kind === 'lesson'
            ? STUDYLM_SYNC_LIMITS.lessons
            : entry.kind === 'progress'
              ? STUDYLM_SYNC_LIMITS.progress
              : STUDYLM_SYNC_LIMITS.settings;
      const bucketLength =
        entry.kind === 'subject'
          ? push.subjects.length
          : entry.kind === 'lesson'
            ? push.lessons.length
            : entry.kind === 'progress'
              ? push.progress.length
              : push.settings.length;
      if (bucketLength >= limitForKind) continue;

      const bytes = JSON.stringify(entry.data).length;
      if (acknowledged.length > 0 && totalBytes + bytes > maxBytes) {
        break;
      }
      totalBytes += bytes;
      acknowledged.push({ key: entry.key, updatedAt: entry.updatedAt });

      switch (entry.kind) {
        case 'subject':
          push.subjects.push(entry.data as SyncedSubjectRecord);
          break;
        case 'lesson':
          push.lessons.push(entry.data as SyncedGeneratedLessonRecord);
          break;
        case 'progress':
          push.progress.push(entry.data as LessonProgress);
          break;
        case 'setting':
          push.settings.push(entry.data as StudyLmSyncRecordOfKind['setting']);
          break;
      }
    }

    return {
      push,
      acknowledged,
      remaining: Math.max(0, entries.length - acknowledged.length),
    };
  }

  async acknowledgeOutbox(
    items: readonly { key: string; updatedAt: string }[],
  ): Promise<void> {
    if (items.length === 0) return;
    const db = await this.open();
    for (const item of items) {
      const mem = this.memoryOutbox.get(item.key);
      if (mem && mem.updatedAt === item.updatedAt) {
        this.memoryOutbox.delete(item.key);
      }
      if (db) {
        try {
          const row = await db.syncOutbox.get(item.key);
          if (row && row.updatedAt === item.updatedAt) {
            await db.syncOutbox.delete(item.key);
          }
        } catch {
          // Ignore failure
        }
      }
    }
  }

  async dropFromOutbox(kind: StudyLmSyncKind, id: string): Promise<void> {
    const key = `${kind}:${id}`;
    this.memoryOutbox.delete(key);
    const db = await this.open();
    if (db) {
      try {
        await db.syncOutbox.delete(key);
      } catch {
        // Ignore failure
      }
    }
  }

  async applySyncPull(
    records: readonly StudyLmPulledRecord[],
  ): Promise<StudyLmPullApplied> {
    const result: StudyLmPullApplied = {
      subjectsChanged: false,
      lessonsChanged: false,
      progressChanged: false,
      settingsChanged: false,
      pulledLessonIds: [],
      appliedCount: 0,
    };
    if (records.length === 0) return result;

    const db = await this.open();
    for (const record of records) {
      const key = `${record.kind}:${record.id}`;
      const memMeta = this.memorySyncMeta.get(key);
      const dbMeta = db ? await db.syncMeta.get(key).catch(() => null) : null;
      const currentMeta = dbMeta ?? memMeta ?? null;

      if (
        !incomingStudyLmWins(currentMeta, {
          updatedAt: record.updatedAt,
          by: record.by,
        })
      ) {
        continue;
      }

      const nextMeta: StudyLmSyncMetaRecord = {
        key,
        updatedAt: record.updatedAt,
        by: record.by,
      };
      this.memorySyncMeta.set(key, nextMeta);
      this.memoryOutbox.delete(key);
      if (db) {
        try {
          await db.syncMeta.put(nextMeta);
          await db.syncOutbox.delete(key);
        } catch {
          // Continue with in-memory state
        }
      }

      result.appliedCount += 1;
      switch (record.kind) {
        case 'subject': {
          if (record.data.deletedAt) {
            await this.deleteSubject(record.id, { fromSync: true });
          } else {
            const { updatedAt: _u, deletedAt: _d, ...subject } = record.data;
            await this.saveSubject(subject, { fromSync: true });
          }
          result.subjectsChanged = true;
          break;
        }
        case 'lesson': {
          if (record.data.deletedAt) {
            this.memoryLessons.delete(record.id);
            if (db) {
              await db.lessons.delete(record.id).catch(() => undefined);
            }
          } else {
            const { updatedAt: _u, deletedAt: _d, ...lesson } = record.data;
            await this.saveGeneratedLesson(
              lesson as unknown as GeneratedLessonRecord,
              { fromSync: true },
            );
          }
          result.lessonsChanged = true;
          result.pulledLessonIds.push(record.id);
          break;
        }
        case 'progress': {
          await this.saveLessonProgress(record.data, { fromSync: true });
          result.progressChanged = true;
          result.pulledLessonIds.push(record.id);
          break;
        }
        case 'setting': {
          await this.saveSetting(record.data.key, record.data.value, {
            fromSync: true,
          });
          result.settingsChanged = true;
          break;
        }
      }
    }

    return result;
  }
}

function safeTimestamp(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed > Date.parse(fallback) ? fallback : value;
}
