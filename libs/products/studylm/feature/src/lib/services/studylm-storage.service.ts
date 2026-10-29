import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type { StudySubject } from '@ah/products/studylm/domain';

export interface StudyLmSettingRecord {
  key: string;
  value: unknown;
}

export class StudyLmDatabase extends Dexie {
  subjects!: Table<StudySubject, string>;
  settings!: Table<StudyLmSettingRecord, string>;

  constructor() {
    super('StudyLmDatabase');
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
  private db: StudyLmDatabase | null = null;
  private readonly memorySubjects = new Map<string, StudySubject>();
  private readonly memorySettings = new Map<string, unknown>();

  constructor() {
    if (typeof indexedDB !== 'undefined') {
      try {
        this.db = new StudyLmDatabase();
      } catch {
        this.db = null;
      }
    }
  }

  async getAllSubjects(): Promise<StudySubject[]> {
    if (!this.db) {
      return Array.from(this.memorySubjects.values());
    }
    try {
      return await this.db.subjects.toArray();
    } catch {
      return Array.from(this.memorySubjects.values());
    }
  }

  async getSubject(id: string): Promise<StudySubject | null> {
    if (!this.db) {
      return this.memorySubjects.get(id) ?? null;
    }
    try {
      const subject = await this.db.subjects.get(id);
      return subject ?? null;
    } catch {
      return this.memorySubjects.get(id) ?? null;
    }
  }

  async saveSubject(subject: StudySubject): Promise<void> {
    this.memorySubjects.set(subject.id, subject);
    if (this.db) {
      try {
        await this.db.subjects.put(subject);
      } catch {
        // Fallback to in-memory silently
      }
    }
  }

  async deleteSubject(id: string): Promise<void> {
    this.memorySubjects.delete(id);
    if (this.db) {
      try {
        await this.db.subjects.delete(id);
      } catch {
        // Fallback silently
      }
    }
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    if (!this.db) {
      return (this.memorySettings.get(key) as T) ?? null;
    }
    try {
      const record = await this.db.settings.get(key);
      return (record?.value as T) ?? null;
    } catch {
      return (this.memorySettings.get(key) as T) ?? null;
    }
  }

  async saveSetting(key: string, value: unknown): Promise<void> {
    this.memorySettings.set(key, value);
    if (this.db) {
      try {
        await this.db.settings.put({ key, value });
      } catch {
        // Fallback silently
      }
    }
  }
}
