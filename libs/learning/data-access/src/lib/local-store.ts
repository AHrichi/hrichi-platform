import {
  type Concept,
  incomingWins,
  isMutableKind,
  type PulledRecord,
  type RecordKind,
  type ReviewEvent,
  SYNC_LIMITS,
  type SyncRequest,
  type Topic,
} from '@ah/learning/domain';
import type {
  LearningDatabase,
  LocalRow,
  OutboxRow,
} from './learning-database';

/** Who wrote a version made before the device was paired. */
export const LOCAL_WRITER = 'local';

/** A paired device's credentials. */
export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  token: string;
  expiresAt: string;
}

/** Which outbox rows a push carried, to clear exactly those afterwards. */
export type OutboxSnapshot = Map<string, number>;

const META_SESSION = 'session';
const META_CURSOR = 'cursor';

/**
 * Reads and writes the device's records. Every change is saved and queued
 * for the next sync in one transaction, so the app never shows a change
 * that sync doesn't know about.
 */
export class LearningLocalStore {
  private lastQueuedAt = 0;

  constructor(
    private readonly db: LearningDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  // Session and cursor

  async session(): Promise<DeviceSession | null> {
    const row = await this.db.meta.get(META_SESSION);
    return (row?.value as DeviceSession | undefined) ?? null;
  }

  async setSession(session: DeviceSession): Promise<void> {
    await this.db.meta.put({ key: META_SESSION, value: session });
  }

  /**
   * Forgets the pairing and the cursor; the records stay. Pairing again
   * pulls everything from the start, which merges without duplicates.
   */
  async clearSession(): Promise<void> {
    await this.db.meta.bulkDelete([META_SESSION, META_CURSOR]);
  }

  async cursor(): Promise<number> {
    const row = await this.db.meta.get(META_CURSOR);
    return typeof row?.value === 'number' ? row.value : 0;
  }

  async setCursor(cursor: number): Promise<void> {
    await this.db.meta.put({ key: META_CURSOR, value: cursor });
  }

  // Reading

  async concepts(): Promise<Concept[]> {
    const rows = await this.db.concepts.toArray();
    return rows
      .map((row) => row.data)
      .filter((concept) => !concept.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async topics(): Promise<Topic[]> {
    const rows = await this.db.topics.toArray();
    return rows
      .map((row) => row.data)
      .filter((topic) => !topic.deletedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async pendingCount(): Promise<number> {
    return this.db.outbox.count();
  }

  // Writing (stamps updatedAt and the writer, then queues)

  async saveTopic(topic: Topic): Promise<Topic> {
    return this.saveMutable('topic', topic);
  }

  async saveConcept(concept: Concept): Promise<Concept> {
    return this.saveMutable('concept', concept);
  }

  /** A tombstone: the deletion syncs like any other change. */
  async deleteConcept(id: string): Promise<void> {
    const row = await this.db.concepts.get(id);
    if (!row || row.data.deletedAt) return;
    const at = this.now().toISOString();
    await this.saveMutable('concept', { ...row.data, deletedAt: at });
  }

  async appendEvent(event: ReviewEvent): Promise<void> {
    const writer = await this.writer();
    await this.db.transaction(
      'rw',
      this.db.events,
      this.db.outbox,
      async () => {
        if (await this.db.events.get(event.id)) return;
        await this.db.events.add({
          id: event.id,
          by: writer,
          updatedAt: event.at,
          data: event,
        });
        await this.queue('event', event.id);
      },
    );
  }

  private async saveMutable<T extends Topic | Concept>(
    kind: 'topic' | 'concept',
    record: T,
  ): Promise<T> {
    const writer = await this.writer();
    const table = this.tableOf(kind);
    const previous = await table.get(record.id);
    const stamped = { ...record, updatedAt: this.stamp(previous?.updatedAt) };
    await this.db.transaction('rw', table, this.db.outbox, async () => {
      await table.put({
        id: stamped.id,
        by: writer,
        updatedAt: stamped.updatedAt,
        data: stamped,
      } as LocalRow<Topic> & LocalRow<Concept>);
      await this.queue(kind, stamped.id);
    });
    return stamped;
  }

  // Sync side

  /** The queued records, as one push within the protocol's limits. */
  async readOutbox(): Promise<{
    push: SyncRequest['push'];
    snapshot: OutboxSnapshot;
  }> {
    const queued = await this.db.outbox.orderBy('key').toArray();
    const push: SyncRequest['push'] = { topics: [], concepts: [], events: [] };
    const snapshot: OutboxSnapshot = new Map();
    const limits = {
      topic: SYNC_LIMITS.pushTopics,
      concept: SYNC_LIMITS.pushConcepts,
      event: SYNC_LIMITS.pushEvents,
    };
    for (const entry of queued) {
      const row = await this.tableOf(entry.kind).get(entry.id);
      if (!row) {
        snapshot.set(entry.key, entry.queuedAt);
        continue;
      }
      const list = (
        {
          topic: push.topics,
          concept: push.concepts,
          event: push.events,
        } as const
      )[entry.kind] as unknown[];
      if (list.length >= limits[entry.kind]) continue;
      list.push(row.data);
      snapshot.set(entry.key, entry.queuedAt);
    }
    return { push, snapshot };
  }

  /** Clears what was pushed, unless it changed again meanwhile. */
  async acknowledge(snapshot: OutboxSnapshot): Promise<void> {
    await this.db.transaction('rw', this.db.outbox, async () => {
      for (const [key, queuedAt] of snapshot) {
        const row = await this.db.outbox.get(key);
        if (row && row.queuedAt === queuedAt) await this.db.outbox.delete(key);
      }
    });
  }

  /** Drops queued changes the server will never take (see Rejection). */
  async dropFromOutbox(kind: RecordKind, id: string): Promise<void> {
    await this.db.outbox.delete(`${kind}:${id}`);
  }

  /**
   * Merges versions from the server: a mutable record is replaced when the
   * pulled version wins (incomingWins), which also drops the local change
   * it beat from the outbox; an event is added once.
   */
  async applyPull(records: PulledRecord[]): Promise<number> {
    let changed = 0;
    await this.db.transaction(
      'rw',
      [this.db.topics, this.db.concepts, this.db.events, this.db.outbox],
      async () => {
        for (const record of records) {
          const table = this.tableOf(record.kind);
          const current = await table.get(record.data.id);
          const updatedAt =
            record.kind === 'event' ? record.data.at : record.data.updatedAt;
          const row = {
            id: record.data.id,
            by: record.by,
            updatedAt,
            data: record.data,
          } as LocalRow<Topic> & LocalRow<Concept> & LocalRow<ReviewEvent>;
          if (isMutableKind(record.kind)) {
            if (!incomingWins(current, row)) continue;
            await table.put(row);
            await this.db.outbox.delete(`${record.kind}:${record.data.id}`);
          } else {
            if (current) continue;
            await table.add(row);
          }
          changed += 1;
        }
      },
    );
    return changed;
  }

  private tableOf(kind: RecordKind) {
    return {
      topic: this.db.topics,
      concept: this.db.concepts,
      event: this.db.events,
    }[kind] as LearningDatabase['concepts'] &
      LearningDatabase['topics'] &
      LearningDatabase['events'];
  }

  private async queue(kind: RecordKind, id: string): Promise<void> {
    const entry: OutboxRow = {
      key: `${kind}:${id}`,
      kind,
      id,
      queuedAt: this.nextQueuedAt(),
    };
    await this.db.outbox.put(entry);
  }

  private async writer(): Promise<string> {
    return (await this.session())?.deviceId ?? LOCAL_WRITER;
  }

  /** Strictly increasing, even for two changes in the same millisecond. */
  private nextQueuedAt(): number {
    this.lastQueuedAt = Math.max(this.lastQueuedAt + 1, Date.now());
    return this.lastQueuedAt;
  }

  /**
   * `updatedAt` for a local change: now, or just after the version it
   * replaces when that one is stamped later (another device's clock ran
   * ahead), so an edit made right after a pull still wins.
   */
  private stamp(previous?: string): string {
    const now = this.now().getTime();
    const after = previous ? Date.parse(previous) + 1 : 0;
    return new Date(Math.max(now, after)).toISOString();
  }
}
