import { Geocoder } from './geocoder';

describe('Geocoder', () => {
  const geocoder = new Geocoder();
  const reply = (body: unknown, ok = true) =>
    vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok, json: async () => body } as Response);

  afterEach(() => vi.restoreAllMocks());

  it('turns search results into named points, in the asked language', async () => {
    const fetch = reply([
      { display_name: 'Ain Draham, Jendouba', lat: '36.78', lon: '8.69' },
    ]);
    const places = await geocoder.search('Ain Draham', 'fr');
    expect(places).toEqual([
      { name: 'Ain Draham, Jendouba', lat: 36.78, lng: 8.69 },
    ]);
    const url = fetch.mock.calls[0][0] as URL;
    expect(url.searchParams.get('accept-language')).toBe('fr');
    expect(url.searchParams.get('q')).toBe('Ain Draham');
  });

  it('names a point by its street and town', async () => {
    reply({ address: { road: 'Rue de Marseille', city: 'Tunis' } });
    expect(await geocoder.reverse(36.8, 10.18, 'en')).toBe(
      'Rue de Marseille, Tunis',
    );
  });

  it('falls back to the full name, then to nothing', async () => {
    reply({ display_name: 'Somewhere' });
    expect(await geocoder.reverse(0, 0, 'en')).toBe('Somewhere');
    reply(null, false);
    expect(await geocoder.reverse(0, 0, 'en')).toBeNull();
  });

  it('returns no places when the service is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    expect(await geocoder.search('x', 'en')).toEqual([]);
  });
});
