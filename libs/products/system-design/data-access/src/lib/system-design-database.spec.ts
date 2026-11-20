import 'fake-indexeddb/auto';
import { SystemDesignDatabase } from './system-design-database';

describe('SystemDesignDatabase', () => {
  it('opens under the name it is given and stores meta rows', async () => {
    const name = `sd-test-${Math.random()}`;
    const db = new SystemDesignDatabase(name);
    await db.meta.put({ key: 'lastLesson', value: 'request-journey' });

    expect(db.name).toBe(name);
    expect((await db.meta.get('lastLesson'))?.value).toBe('request-journey');
    db.close();
  });
});
