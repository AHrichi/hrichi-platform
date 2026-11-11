import 'fake-indexeddb/auto';
import {
  FIXTURE_IDS,
  incomingWins,
  type PulledRecord,
  sampleCapture,
  sampleConcept,
  sampleEvent,
  sampleTopic,
  type SyncRequest,
  type SyncResponse,
} from '@ah/learning/domain';
import { LearningApiError } from './learning-api';
import { LearningDatabase } from './learning-database';
import { LearningLocalStore, LOCAL_WRITER } from './local-store';
import {
  type AudioUploader,
  LearningSyncClient,
  type SyncTransport,
} from './sync-client';

/**
 * The server's semantics in a few lines (the real one is SyncService in
 * api-learning, tested there): stamp the writer, keep the winning version,
 * hand back what changed after the cursor except this request's writes.
 */
class FakeServer {
  private seq = 0;
  readonly records = new Map<string, PulledRecord>();
  offline = false;
  revoked = new Set<string>();

  readonly audio = new Map<string, string>();

  /** Takes audio only for a capture it already has, like the real API. */
  uploaderFor(): AudioUploader {
    return async (captureId, audio) => {
      if (this.offline) throw new LearningApiError('network', 'offline');
      if (!this.records.has(`capture:${captureId}`)) {
        throw new LearningApiError('refused', 'not yet', 404);
      }
      this.audio.set(captureId, audio.mimeType);
    };
  }

  transportFor(deviceId: string): SyncTransport {
    return async (request: SyncRequest): Promise<SyncResponse> => {
      if (this.offline) throw new LearningApiError('network', 'offline');
      if (this.revoked.has(deviceId)) {
        throw new LearningApiError('unauthorized', 'revoked', 401);
      }
      const written = new Set<number>();
      const put = (record: PulledRecord) => {
        const key = `${record.kind}:${record.data.id}`;
        const current = this.records.get(key);
        const revision = (r: PulledRecord) => ({
          updatedAt: r.kind === 'event' ? r.data.at : r.data.updatedAt,
          by: r.by,
        });
        const wins =
          record.kind === 'event'
            ? !current
            : incomingWins(current && revision(current), revision(record));
        const seq = ++this.seq;
        if (!wins) return;
        this.records.set(key, { ...record, seq } as PulledRecord);
        written.add(seq);
      };
      for (const data of request.push.topics)
        put({ kind: 'topic', seq: 0, by: deviceId, data });
      for (const data of request.push.concepts)
        put({ kind: 'concept', seq: 0, by: deviceId, data });
      for (const data of request.push.captures)
        put({ kind: 'capture', seq: 0, by: deviceId, data });
      for (const data of request.push.events)
        put({ kind: 'event', seq: 0, by: deviceId, data });
      const changes = [...this.records.values()]
        .filter((record) => record.seq > request.cursor)
        .sort((a, b) => a.seq - b.seq);
      return {
        cursor: changes.at(-1)?.seq ?? request.cursor,
        more: false,
        pull: changes.filter((record) => !written.has(record.seq)),
        rejected: [],
        serverTime: new Date().toISOString(),
        renewedToken: null,
      };
    };
  }
}

let clock = new Date('2026-11-11T09:00:00Z');
const tick = () => {
  clock = new Date(clock.getTime() + 60_000);
};

async function device(server: FakeServer, deviceId: string, paired = true) {
  const db = new LearningDatabase(`learning-${deviceId}-${Math.random()}`);
  const store = new LearningLocalStore(db, () => clock);
  if (paired) {
    await store.setSession({
      deviceId,
      deviceName: deviceId === FIXTURE_IDS.deviceA ? 'Phone' : 'Laptop',
      token: `token-${deviceId}`,
      expiresAt: '2027-05-01T00:00:00.000Z',
    });
  }
  return {
    store,
    client: new LearningSyncClient(
      store,
      server.transportFor(deviceId),
      server.uploaderFor(),
    ),
  };
}

describe('LearningSyncClient with two devices', () => {
  it('carries a concept and its topic from the phone to the laptop', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    const laptop = await device(server, FIXTURE_IDS.deviceB);

    await phone.store.saveTopic(sampleTopic());
    await phone.store.saveConcept(sampleConcept());
    expect(await phone.store.pendingCount()).toBe(2);

    expect(await phone.client.sync()).toMatchObject({
      status: 'synced',
      pushed: 2,
    });
    expect(await phone.store.pendingCount()).toBe(0);
    expect(await laptop.client.sync()).toMatchObject({
      status: 'synced',
      pulled: 2,
    });
    expect((await laptop.store.concepts()).map((c) => c.title)).toEqual([
      'Opportunity cost',
    ]);
  });

  it('converges on the latest edit after both edit offline', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    const laptop = await device(server, FIXTURE_IDS.deviceB);
    await phone.store.saveConcept(sampleConcept());
    await phone.client.sync();
    await laptop.client.sync();

    tick();
    await phone.store.saveConcept(
      sampleConcept({ title: 'Edited on the phone' }),
    );
    tick();
    await laptop.store.saveConcept(
      sampleConcept({ title: 'Edited on the laptop' }),
    );

    await phone.client.sync();
    await laptop.client.sync();
    await phone.client.sync();

    for (const side of [phone, laptop]) {
      expect((await side.store.concepts())[0].title).toBe(
        'Edited on the laptop',
      );
      expect(await side.store.pendingCount()).toBe(0);
    }
  });

  it('syncs a deletion and appends events once', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    const laptop = await device(server, FIXTURE_IDS.deviceB);
    await phone.store.saveConcept(sampleConcept());
    await phone.store.appendEvent(sampleEvent());
    await phone.store.appendEvent(sampleEvent());
    await phone.client.sync();
    await laptop.client.sync();

    tick();
    await laptop.store.deleteConcept(FIXTURE_IDS.concept);
    await laptop.client.sync();
    await phone.client.sync();

    expect(await phone.store.concepts()).toEqual([]);
    expect(server.records.size).toBe(2);
  });

  it('keeps changes queued while offline and sends them later', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    server.offline = true;
    await phone.store.saveConcept(sampleConcept());
    expect(await phone.client.sync()).toMatchObject({
      status: 'failed',
      offline: true,
    });
    expect(await phone.store.pendingCount()).toBe(1);

    server.offline = false;
    expect(await phone.client.sync()).toMatchObject({
      status: 'synced',
      pushed: 1,
    });
  });

  it('works unpaired, and forgets a revoked pairing but not the data', async () => {
    const server = new FakeServer();
    const loose = await device(server, FIXTURE_IDS.deviceA, false);
    const saved = await loose.store.saveConcept(sampleConcept());
    expect(saved.updatedAt).toBe(clock.toISOString());
    expect(await loose.client.sync()).toEqual({ status: 'unpaired' });

    const phone = await device(server, FIXTURE_IDS.deviceB);
    await phone.store.saveConcept(sampleConcept());
    server.revoked.add(FIXTURE_IDS.deviceB);
    expect(await phone.client.sync()).toEqual({ status: 'unpaired' });
    expect(await phone.store.session()).toBeNull();
    expect(await phone.store.concepts()).toHaveLength(1);
    expect(await phone.store.pendingCount()).toBe(1);
  });

  it('stamps an edit after a version from a clock that ran ahead', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    const ahead = new Date(clock.getTime() + 5 * 60_000).toISOString();
    await phone.store.applyPull([
      {
        kind: 'concept',
        seq: 1,
        by: FIXTURE_IDS.deviceB,
        data: sampleConcept({ updatedAt: ahead }),
      },
    ]);
    const edited = await phone.store.saveConcept(
      sampleConcept({ title: 'Edited right after the pull' }),
    );
    expect(Date.parse(edited.updatedAt)).toBe(Date.parse(ahead) + 1);
  });

  it('keeps a change made during a sync queued for the next one', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    await phone.store.saveConcept(sampleConcept());
    const { snapshot } = await phone.store.readOutbox();
    tick();
    await phone.store.saveConcept(sampleConcept({ title: 'Changed mid-sync' }));
    await phone.store.acknowledge(snapshot);
    expect(await phone.store.pendingCount()).toBe(1);
  });

  it('sends a voice note’s audio after its capture, then forgets it', async () => {
    const server = new FakeServer();
    const phone = await device(server, FIXTURE_IDS.deviceA);
    await phone.store.addVoiceCapture(
      sampleCapture({ modality: 'voice', text: null, hasAudio: true }),
      { bytes: new Uint8Array([1, 2, 3]).buffer, mimeType: 'audio/webm' },
    );
    expect(await phone.store.pendingAudio()).toHaveLength(1);

    server.offline = true;
    await phone.client.sync();
    expect(await phone.store.pendingAudio()).toHaveLength(1);

    server.offline = false;
    expect(await phone.client.sync()).toMatchObject({
      status: 'synced',
      pushed: 1,
      uploaded: 1,
    });
    expect(server.audio.get(FIXTURE_IDS.capture)).toBe('audio/webm');
    expect(await phone.store.pendingAudio()).toEqual([]);
    expect((await phone.store.captures())[0].hasAudio).toBe(true);
  });

  it('writes as the local writer before pairing', async () => {
    const server = new FakeServer();
    const loose = await device(server, FIXTURE_IDS.deviceA, false);
    await loose.store.saveTopic(sampleTopic());
    const { push } = await loose.store.readOutbox();
    expect(push.topics).toHaveLength(1);
    expect(LOCAL_WRITER).toBe('local');
  });
});
