import { cities } from '@ah/labs/orbit/domain';
import { ApiError, OrbitApi } from './orbit-api';

const tunis = cities[0];

function respond(...answers: (Response | Error)[]) {
  return vi.fn(async () => {
    const answer = answers.shift();
    if (!answer || answer instanceof Error) {
      throw answer ?? new TypeError('Failed to fetch');
    }
    return answer;
  }) as unknown as typeof fetch;
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), init);

describe('OrbitApi', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('asks for passes over a city for three days', async () => {
    const fetcher = respond(json({ passes: [] }));
    const api = new OrbitApi('https://orbit.test', fetcher);

    await api.passes(25544, tunis);

    expect(fetcher).toHaveBeenCalledWith(
      'https://orbit.test/satellites/25544/passes?lat=36.8065&lon=10.1815&days=3&ngsw-bypass=true',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('waits for a sleeping instance and says it is waking', async () => {
    const fetcher = respond(
      new TypeError('Failed to fetch'),
      json({ count: 3 }),
    );
    const onWaking = vi.fn();
    const api = new OrbitApi('https://orbit.test', fetcher);

    const catalog = api.catalog({ onWaking });
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(catalog).resolves.toEqual({ count: 3 });
    expect(onWaking).toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('honours Retry-After while the catalog is indexing', async () => {
    const fetcher = respond(
      new Response('', { status: 503, headers: { 'Retry-After': '5' } }),
      json({ count: 1 }),
    );
    const api = new OrbitApi('https://orbit.test', fetcher);

    const catalog = api.catalog();
    await vi.advanceTimersByTimeAsync(4_999);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(catalog).resolves.toEqual({ count: 1 });
  });

  it('fails at once on a client error, with the problem details', async () => {
    const problem = { title: 'Satellite not found', status: 404 };
    const api = new OrbitApi(
      'https://orbit.test',
      respond(json(problem, { status: 404 })),
    );

    const error = await api.passes(1, tunis).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, problem });
  });

  it('gives up after the deadline', async () => {
    const api = new OrbitApi(
      'https://orbit.test',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    );

    const catalog = api.catalog().catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(200_000);

    expect(await catalog).toBeInstanceOf(ApiError);
  });
});
