import { inject, Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import type { StudySubject } from '@ah/products/studylm/domain';
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

export class StudyLmDatabase extends Dexie {
  subjects!: Table<StudySubject, string>;
  settings!: Table<StudyLmSettingRecord, string>;
  lessonProgress!: Table<LessonProgress, string>;
  lessons!: Table<GeneratedLessonRecord, string>;

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
  }
}

@Injectable({
  providedIn: 'root',
})
export class StudyLmStorageService {
  private readonly mode = inject(APP_MODE);
  private database: Promise<StudyLmDatabase | null> | null = null;
  private readonly memorySubjects = new Map<string, StudySubject>();
  private readonly memorySettings = new Map<string, unknown>();
  private readonly memoryProgress = new Map<string, LessonProgress>();
  private readonly memoryLessons = new Map<string, GeneratedLessonRecord>();

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

  async saveSubject(subject: StudySubject): Promise<void> {
    this.memorySubjects.set(subject.id, subject);
    const db = await this.open();
    if (db) {
      try {
        await db.subjects.put(subject);
      } catch {
        // Fallback to in-memory silently
      }
    }
  }

  async deleteSubject(id: string): Promise<void> {
    this.memorySubjects.delete(id);
    const db = await this.open();
    if (db) {
      try {
        await db.subjects.delete(id);
      } catch {
        // Fallback silently
      }
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

  async saveSetting(key: string, value: unknown): Promise<void> {
    this.memorySettings.set(key, value);
    const db = await this.open();
    if (db) {
      try {
        await db.settings.put({ key, value });
      } catch {
        // Fallback silently
      }
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

  async saveLessonProgress(progress: LessonProgress): Promise<void> {
    this.memoryProgress.set(progress.lessonId, progress);
    const db = await this.open();
    if (db) {
      try {
        await db.lessonProgress.put(progress);
      } catch {
        // Kept in memory for this visit
      }
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

  async saveGeneratedLesson(record: GeneratedLessonRecord): Promise<void> {
    this.memoryLessons.set(record.id, record);
    const db = await this.open();
    if (db) {
      try {
        await db.lessons.put(record);
      } catch {
        // Kept in memory for this visit
      }
    }
  }

  async deleteGeneratedLessons(subjectId: string): Promise<void> {
    for (const [id, record] of this.memoryLessons) {
      if (record.subjectId === subjectId) this.memoryLessons.delete(id);
    }
    const db = await this.open();
    if (db) {
      try {
        await db.lessons.where('subjectId').equals(subjectId).delete();
      } catch {
        // Nothing else to do
      }
    }
  }
}
