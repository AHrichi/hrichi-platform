import { inject, Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import type { StudySubject } from '@ah/products/studylm/domain';

export interface StudyLmSettingRecord {
  key: string;
  value: unknown;
}

export class StudyLmDatabase extends Dexie {
  subjects!: Table<StudySubject, string>;
  settings!: Table<StudyLmSettingRecord, string>;

  constructor(name = 'StudyLmDatabase') {
    super(name);
    this.version(1).stores({
      subjects: 'id, title, domain, createdAt',
      settings: 'key',
    });
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
}
