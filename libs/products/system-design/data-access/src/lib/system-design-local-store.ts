import type {
  AttemptRow,
  DesignRow,
  ProgressRow,
  SystemDesignDatabase,
} from './system-design-database';

/**
 * Typed repository wrapper over `SystemDesignDatabase` for lesson progress,
 * practice attempts, saved lab designs, and key-value metadata.
 */
export class SystemDesignLocalStore {
  constructor(readonly db: SystemDesignDatabase) {}

  async allProgress(): Promise<ProgressRow[]> {
    return this.db.progress.toArray();
  }

  async getProgress(lessonId: string): Promise<ProgressRow | undefined> {
    return this.db.progress.get(lessonId);
  }

  async putProgress(row: ProgressRow): Promise<void> {
    await this.db.progress.put(row);
  }

  async allAttempts(): Promise<AttemptRow[]> {
    return this.db.attempts.orderBy('id').toArray();
  }

  async attemptsForLesson(lessonId: string): Promise<AttemptRow[]> {
    return this.db.attempts.where('lessonId').equals(lessonId).toArray();
  }

  async attemptsForCheck(
    lessonId: string,
    checkId: string,
  ): Promise<AttemptRow[]> {
    return this.db.attempts
      .where('[lessonId+checkId]')
      .equals([lessonId, checkId])
      .toArray();
  }

  async addAttempt(attempt: Omit<AttemptRow, 'id'>): Promise<number> {
    return this.db.attempts.add(attempt as AttemptRow);
  }

  async allDesigns(): Promise<DesignRow[]> {
    return this.db.designs.toArray();
  }

  async getDesign(id: string): Promise<DesignRow | undefined> {
    return this.db.designs.get(id);
  }

  async putDesign(row: DesignRow): Promise<void> {
    await this.db.designs.put(row);
  }

  async getMeta<T = unknown>(key: string): Promise<T | null> {
    const row = await this.db.meta.get(key);
    return (row?.value as T | undefined) ?? null;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.db.meta.put({ key, value });
  }
}
