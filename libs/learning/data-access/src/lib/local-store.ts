import {
  type Capture,
  type Concept,
  type ReviewSession,
  incomingWins,
  isMutableKind,
  type PulledRecord,
  type RecordKind,
  type ReviewEvent,
  SYNC_LIMITS,
  type SyncRequest,
  type TeachBack,
  type Topic,
} from '@ah/learning/domain';
import type {
  AudioRow,
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

  /** A device-level setting kept beside the records (never synced). */
  async getMeta<T>(key: string): Promise<T | null> {
    const row = await this.db.meta.get(`setting:${key}`);
    return (row?.value as T | undefined) ?? null;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.db.meta.put({ key: `setting:${key}`, value });
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

  async captures(): Promise<Capture[]> {
    const rows = await this.db.captures.toArray();
    return rows
      .map((row) => row.data)
      .filter((capture) => !capture.deletedAt)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }

  /** Voice notes whose audio the server doesn't have yet. */
  async pendingAudio(): Promise<AudioRow[]> {
    return this.db.audio.orderBy('captureId').toArray();
  }

  async dropAudio(captureId: string): Promise<void> {
    await this.db.audio.delete(captureId);
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

  async sessions(): Promise<ReviewSession[]> {
    const rows = await this.db.sessions.toArray();
    return rows
      .map((row) => row.data)
      .filter((session) => !session.deletedAt)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }

  async events(): Promise<ReviewEvent[]> {
    const rows = await this.db.events.toArray();
    return rows.map((row) => row.data);
  }

  async teachBacks(): Promise<TeachBack[]> {
    const rows = await this.db.teachbacks.toArray();
    return rows.map((row) => row.data).sort((a, b) => a.at.localeCompare(b.at));
  }

  /** A teach-back is only ever added, like a review event. */
  async appendTeachBack(teachBack: TeachBack): Promise<void> {
    const writer = await this.writer();
    await this.db.transaction(
      'rw',
      this.db.teachbacks,
      this.db.outbox,
      async () => {
        if (await this.db.teachbacks.get(teachBack.id)) return;
        await this.db.teachbacks.add({
          id: teachBack.id,
          by: writer,
          updatedAt: teachBack.at,
          data: teachBack,
        });
        await this.queue('teachback', teachBack.id);
      },
    );
  }

  async saveSession(session: ReviewSession): Promise<ReviewSession> {
    return this.saveMutable('session', session);
  }

  async saveCapture(capture: Capture): Promise<Capture> {
    return this.saveMutable('capture', capture);
  }

  /** A voice note: its audio first, then the capture that waits for it. */
  async addVoiceCapture(
    capture: Capture,
    audio: { bytes: ArrayBuffer; mimeType: string },
  ): Promise<Capture> {
    await this.db.audio.put({
      captureId: capture.id,
      bytes: audio.bytes,
      mimeType: audio.mimeType,
      createdAt: this.now().toISOString(),
    });
    return this.saveMutable('capture', capture);
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

  private async saveMutable<
    T extends Topic | Concept | Capture | ReviewSession,
  >(kind: 'topic' | 'concept' | 'capture' | 'session', record: T): Promise<T> {
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
      } as LocalRow<Topic> &
        LocalRow<Concept> &
        LocalRow<Capture> &
        LocalRow<ReviewSession>);
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
    const push: SyncRequest['push'] = {
      topics: [],
      concepts: [],
      captures: [],
      sessions: [],
      events: [],
      teachbacks: [],
    };
    const snapshot: OutboxSnapshot = new Map();
    const limits = {
      topic: SYNC_LIMITS.pushTopics,
      concept: SYNC_LIMITS.pushConcepts,
      capture: SYNC_LIMITS.pushCaptures,
      session: SYNC_LIMITS.pushSessions,
      event: SYNC_LIMITS.pushEvents,
      teachback: SYNC_LIMITS.pushTeachBacks,
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
          capture: push.captures,
          session: push.sessions,
          event: push.events,
          teachback: push.teachbacks,
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
      [
        this.db.topics,
        this.db.concepts,
        this.db.captures,
        this.db.sessions,
        this.db.events,
        this.db.teachbacks,
        this.db.outbox,
      ],
      async () => {
        for (const record of records) {
          const table = this.tableOf(record.kind);
          const current = await table.get(record.data.id);
          const updatedAt =
            record.kind === 'event' || record.kind === 'teachback'
              ? record.data.at
              : record.data.updatedAt;
          const row = {
            id: record.data.id,
            by: record.by,
            updatedAt,
            data: record.data,
          } as LocalRow<Topic> &
            LocalRow<Concept> &
            LocalRow<Capture> &
            LocalRow<ReviewSession> &
            LocalRow<ReviewEvent> &
            LocalRow<TeachBack>;
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
      capture: this.db.captures,
      session: this.db.sessions,
      event: this.db.events,
      teachback: this.db.teachbacks,
    }[kind] as LearningDatabase['concepts'] &
      LearningDatabase['topics'] &
      LearningDatabase['captures'] &
      LearningDatabase['sessions'] &
      LearningDatabase['events'] &
      LearningDatabase['teachbacks'];
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
