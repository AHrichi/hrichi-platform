import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { databaseExists, databaseName } from './database-name';

/** Creates `name` at version 1 with one record, as an app would. */
function create(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () =>
      request.result
        .createObjectStore('trips', { keyPath: 'id' })
        .put({ id: 'trip_1', name: 'Aïn Draham' });
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function names(): Promise<string[]> {
  return (await indexedDB.databases()).map((db) => db.name ?? '').sort();
}

beforeEach(() => {
  // Every test starts on an origin with no databases.
  Object.assign(globalThis, { indexedDB: new IDBFactory() });
});

describe('databaseName', () => {
  it('uses the standalone name outside the portfolio', async () => {
    await create('ah-demo-basecamp');
    expect(await databaseName('standalone', 'basecamp', 'basecamp_db_v1')).toBe(
      'basecamp_db_v1',
    );
  });

  it('gives a new visitor to the portfolio the demo database', async () => {
    expect(
      await databaseName('embedded-demo', 'basecamp', 'basecamp_db_v1'),
    ).toBe('ah-demo-basecamp');
    // Looking for the two databases created neither.
    expect(await names()).toEqual([]);
  });

  it('keeps the database a browser already used in the portfolio', async () => {
    await create('basecamp_db_v1');
    expect(
      await databaseName('embedded-demo', 'basecamp', 'basecamp_db_v1'),
    ).toBe('basecamp_db_v1');
    expect(await names()).toEqual(['basecamp_db_v1']);
  });

  it('prefers the demo database when both exist', async () => {
    await create('basecamp_db_v1');
    await create('ah-demo-basecamp');
    expect(
      await databaseName('embedded-demo', 'basecamp', 'basecamp_db_v1'),
    ).toBe('ah-demo-basecamp');
  });
});

describe('databaseExists', () => {
  it('finds a database without changing it', async () => {
    await create('basecamp_db_v1');
    expect(await databaseExists('basecamp_db_v1')).toBe(true);

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('basecamp_db_v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(db.version).toBe(1);
    const trip = await new Promise((resolve) => {
      const request = db
        .transaction('trips')
        .objectStore('trips')
        .get('trip_1');
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    expect(trip).toEqual({ id: 'trip_1', name: 'Aïn Draham' });
  });

  it('reports a missing database and leaves none behind', async () => {
    expect(await databaseExists('basecamp_db_v1')).toBe(false);
    expect(await names()).toEqual([]);
  });
});
