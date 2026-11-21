import type {
  Attempt,
  CheckResponse,
  LabDesign,
  LessonProgress,
  Traffic,
} from '@ah/products/system-design/domain';
import Dexie, { type Table } from 'dexie';

export type ProgressRow = LessonProgress;

/**
 * The practice run an answer belongs to. Not indexed, so it needs no schema
 * version: best scores group a lesson's answers by `run.id`.
 */
export interface AttemptRun {
  id: string;
  kind: 'lesson' | 'mix';
  /** How many questions the run asked. */
  size: number;
}

export interface AttemptRow extends Attempt {
  id?: number;
  answer: CheckResponse;
  /** Absent on answers saved outside a practice run. */
  run?: AttemptRun;
}

export interface DesignRow {
  /** Challenge id, or `'free'` for the sandbox. */
  id: string;
  design: LabDesign;
  /** The sandbox's traffic controls; challenges fix their own. */
  traffic?: Traffic;
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
