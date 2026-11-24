import 'fake-indexeddb/auto';
import type { HygieneCheck } from '@ah/products/greenhouse/domain';
import { FieldDatabase } from './field-database';
import { RemoteError } from '../remote/remote-error';
import type { FieldRemote } from './field-remote';
import { FieldRepository } from './field-repository';
import { HygieneSync } from './hygiene-sync';

const FARM = 'farm-1';

/** A server that records what arrives, in order, and fails on demand. */
class FakeRemote implements FieldRemote {
  calls: string[] = [];
  failPhoto: RemoteError | null = null;
  failCheck: ((check: HygieneCheck) => RemoteError | null) | null = null;

  async pushLogs(): Promise<void> {
    throw new RemoteError('server', 'not used');
  }

  async fetchRoster(): Promise<never> {
    throw new RemoteError('server', 'not used');
  }

  async uploadPhoto(path: string): Promise<void> {
    if (this.failPhoto) throw this.failPhoto;
    this.calls.push(`photo ${path}`);
  }

  async pushCheck(_farmId: string, check: HygieneCheck): Promise<void> {
    const error = this.failCheck?.(check);
    if (error) throw error;
    this.calls.push(`check ${check.id}${check.signedAt ? ' signed' : ''}`);
  }
}

const check = (id: string, over: Partial<HygieneCheck> = {}): HygieneCheck => ({
  id,
  date: '2026-11-23',
  greenhouseId: `gh-${id}`,
  supervisorId: 'sup-1',
  answers: [],
  signedAt: null,
  ...over,
});

const photo = (path: string, checkId: string) => ({
  path,
  checkId,
  itemId: 'hyg-1',
  blob: new Blob(['jpeg'], { type: 'image/jpeg' }),
});

let dbCount = 0;
let db: FieldDatabase;
let repo: FieldRepository;
let remote: FakeRemote;
let sync: HygieneSync;

beforeEach(() => {
  db = new FieldDatabase(`hygiene-test-${++dbCount}`);
  repo = new FieldRepository(db);
  remote = new FakeRemote();
  sync = new HygieneSync(db, remote);
});

afterEach(() => db.close());

describe('HygieneSync', () => {
  it('uploads a check’s photos before the check, and drops strays', async () => {
    await repo.addPhoto(photo('farm-1/a/1.jpg', 'a'));
    await repo.addPhoto(photo('farm-1/a/stray.jpg', 'a'));
    await repo.saveCheck(
      FARM,
      check('a', {
        answers: [
          { itemId: 'hyg-1', ok: true, photoPaths: ['farm-1/a/1.jpg'] },
        ],
      }),
    );
    expect(await sync.flush()).toEqual({
      sent: 1,
      rejected: 0,
      pending: 0,
      stoppedBy: null,
    });
    expect(remote.calls).toEqual(['photo farm-1/a/1.jpg', 'check a']);
    // The check is still open: its photo stays to be shown, the stray goes.
    expect(await repo.photo('farm-1/a/1.jpg')).not.toBeNull();
    expect(await repo.photo('farm-1/a/stray.jpg')).toBeNull();
  });

  it('frees the phone of a signed check’s photos once it is through', async () => {
    await repo.addPhoto(photo('farm-1/a/1.jpg', 'a'));
    await repo.saveCheck(
      FARM,
      check('a', {
        answers: [
          { itemId: 'hyg-1', ok: true, photoPaths: ['farm-1/a/1.jpg'] },
        ],
        signedAt: '2026-11-23T08:00:00.000Z',
      }),
    );
    await sync.flush();
    expect(remote.calls).toEqual(['photo farm-1/a/1.jpg', 'check a signed']);
    expect(await repo.photo('farm-1/a/1.jpg')).toBeNull();
    expect((await repo.checkFor('2026-11-23', 'gh-a'))?.status).toBe('synced');
  });

  it('stops with no signal and keeps everything for next time', async () => {
    await repo.addPhoto(photo('farm-1/a/1.jpg', 'a'));
    await repo.saveCheck(
      FARM,
      check('a', {
        answers: [
          { itemId: 'hyg-1', ok: true, photoPaths: ['farm-1/a/1.jpg'] },
        ],
      }),
    );
    remote.failPhoto = new RemoteError('offline', 'no signal');
    expect(await sync.flush()).toMatchObject({
      sent: 0,
      pending: 1,
      stoppedBy: 'offline',
    });
    remote.failPhoto = null;
    expect(await sync.flush()).toMatchObject({ sent: 1, pending: 0 });
  });

  it('marks a refused check and carries on with the next', async () => {
    await repo.saveCheck(FARM, check('a'));
    await repo.saveCheck(FARM, check('b'));
    remote.failCheck = (c) =>
      c.id === 'a'
        ? new RemoteError('rejected', 'already checked today')
        : null;
    expect(await sync.flush()).toMatchObject({ sent: 1, rejected: 1 });
    expect(await repo.checkFor('2026-11-23', 'gh-a')).toMatchObject({
      status: 'rejected',
      error: 'already checked today',
    });
  });

  it('leaves a check edited mid-send pending', async () => {
    await repo.saveCheck(FARM, check('a'));
    remote.failCheck = () => {
      void repo.saveCheck(FARM, check('a', { answers: [] }));
      return null;
    };
    await sync.flush();
    // Let the edit land.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect((await repo.checkFor('2026-11-23', 'gh-a'))?.status).toBe('pending');
  });
});
