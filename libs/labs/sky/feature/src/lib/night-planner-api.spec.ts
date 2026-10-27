import { placeAt } from '@ah/labs/sky/domain';
import { ApiError, NightPlannerApi } from './night-planner-api';

const campsite = placeAt(36.8065, 10.1815);

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

describe('NightPlannerApi', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('asks for two weeks of nights at coordinates rounded to 0.1°', async () => {
    const fetcher = respond(json({ nights: [] }));
    const api = new NightPlannerApi('https://planner.test', fetcher);

    await api.nights(campsite, 'Africa/Tunis');

    expect(fetcher).toHaveBeenCalledWith(
      'https://planner.test/nights?lat=36.8&lon=10.2&days=14&zone=Africa%2FTunis&ngsw-bypass=true',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('waits for a sleeping instance and says it is waking', async () => {
    const fetcher = respond(
      new TypeError('Failed to fetch'),
      json({ nights: [1] }),
    );
    const onWaking = vi.fn();
    const api = new NightPlannerApi('https://planner.test', fetcher);

    const nights = api.nights(campsite, 'UTC', { onWaking });
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(nights).resolves.toEqual({ nights: [1] });
    expect(onWaking).toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('honours Retry-After', async () => {
    const fetcher = respond(
      new Response('', { status: 503, headers: { 'Retry-After': '5' } }),
      json({ nights: [] }),
    );
    const api = new NightPlannerApi('https://planner.test', fetcher);

    const nights = api.nights(campsite, 'UTC');
    await vi.advanceTimersByTimeAsync(4_999);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(nights).resolves.toEqual({ nights: [] });
  });

  it('fails at once on a client error, with the problem details', async () => {
    const problem = { title: 'Invalid request', status: 400 };
    const api = new NightPlannerApi(
      'https://planner.test',
      respond(json(problem, { status: 400 })),
    );

    const error = await api.nights(campsite, 'UTC').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, problem });
  });

  it('gives up after the deadline', async () => {
    const api = new NightPlannerApi(
      'https://planner.test',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    );

    const nights = api.nights(campsite, 'UTC').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(160_000);

    expect(await nights).toBeInstanceOf(ApiError);
  });
});
