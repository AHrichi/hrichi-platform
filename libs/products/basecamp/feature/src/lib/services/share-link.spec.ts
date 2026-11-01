import { sampleTrip } from '@ah/products/basecamp/domain';
import { decodeTrip, encodeTrip } from './share-link';

let n = 0;
const trip = sampleTrip('2026-11-01', () => `id-${++n}`);

describe('Share links', () => {
  it('carries a whole trip in a short fragment, unchanged', async () => {
    const fragment = await encodeTrip(trip);
    expect(fragment).toMatch(/^trip=[A-Za-z0-9_-]+$/);
    expect(fragment.length).toBeLessThan(2500);
    expect(await decodeTrip(`#${fragment}`)).toEqual({ trip });
  });

  it('refuses a damaged or foreign fragment', async () => {
    const fragment = await encodeTrip(trip);
    expect(await decodeTrip(fragment.slice(0, -20) + 'xx')).toEqual({
      error: 'notJson',
    });
    expect(await decodeTrip('#section-2')).toEqual({ error: 'notBasecamp' });
  });
});
