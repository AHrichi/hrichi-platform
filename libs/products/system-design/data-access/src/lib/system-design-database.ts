import type {
  Attempt,
  CheckResponse,
  LessonProgress,
} from '@ah/products/system-design/domain';
import Dexie, { type Table } from 'dexie';

export type ProgressRow = LessonProgress;

export interface AttemptRow extends Attempt {
  id?: number;
  answer: CheckResponse;
}

export interface DesignRow {
  /** Challenge id, or `'free'` for the sandbox. */
  id: string;
  design: unknown;
  traffic?: unknown;
  updatedAt: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

/**
 * The app's IndexedDB database. Its name comes from the feature layer
 * (`databaseName()` in `@ah/platform/storage`), so the portfolio demo opens
 * `ah-demo-system-design` and never touches standalone data.
 */
export class SystemDesignDatabase extends Dexie {
  progress!: Table<ProgressRow, string>;
  attempts!: Table<AttemptRow, number>;
  designs!: Table<DesignRow, string>;
  meta!: Table<MetaRow, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      progress: 'lessonId, updatedAt',
      attempts: '++id, [lessonId+checkId], lessonId, at',
      designs: 'id',
      meta: 'key',
    });
  }
}
