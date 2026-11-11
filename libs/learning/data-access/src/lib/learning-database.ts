import Dexie, { type Table } from 'dexie';
import type {
  Capture,
  Concept,
  ReviewSession,
  RecordKind,
  ReviewEvent,
  Topic,
} from '@ah/learning/domain';

/** A record as this device keeps it: the data plus who wrote this version. */
export interface LocalRow<T> {
  id: string;
  /** The device that wrote this version (LOCAL_WRITER before pairing). */
  by: string;
  updatedAt: string;
  data: T;
}

/** A local change waiting to be pushed. */
export interface OutboxRow {
  /** `<kind>:<id>`: a record is queued once, however often it changes. */
  key: string;
  kind: RecordKind;
  id: string;
  /** Bumped on every change, so a change made during a sync isn't lost. */
  queuedAt: number;
}

/** A voice note's audio, kept until the server has it (design §7). */
export interface AudioRow {
  captureId: string;
  /** Raw bytes; Blobs don't survive every IndexedDB implementation. */
  bytes: ArrayBuffer;
  mimeType: string;
  createdAt: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

/**
 * The Learning Engine's database on this device (design §4.2). The app
 * names it through `databaseName`, so the portfolio's demo opens its own.
 */
export class LearningDatabase extends Dexie {
  topics!: Table<LocalRow<Topic>, string>;
  concepts!: Table<LocalRow<Concept>, string>;
  events!: Table<LocalRow<ReviewEvent>, string>;
  captures!: Table<LocalRow<Capture>, string>;
  audio!: Table<AudioRow, string>;
  sessions!: Table<LocalRow<ReviewSession>, string>;
  outbox!: Table<OutboxRow, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'LearningDatabase') {
    super(name);
    this.version(1).stores({
      topics: 'id',
      concepts: 'id, data.topicId, data.status',
      events: 'id, data.conceptId, data.localDate',
      outbox: 'key, kind',
      meta: 'key',
    });
    // Version 2 (L2) adds captures and the audio of voice notes.
    this.version(2).stores({
      captures: 'id, data.status',
      audio: 'captureId',
    });
    // Version 3 (L3) adds the Daily Sets.
    this.version(3).stores({ sessions: 'id, data.localDate' });
  }
}
