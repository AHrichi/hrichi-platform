import type { LeadRequest } from '@ah/shared/contracts';
import { LeadError, retryDelaysMs, sendLead } from './lead-client';

const lead: LeadRequest = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello',
  intent: 'project',
  idempotencyKey: '8f14e45f-ceea-467f-a8f3-5c4b2b6a7d10',
  turnstileToken: 'token',
};

const respond = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status });

describe('sendLead', () => {
  const sleep = vi.fn(() => Promise.resolve());

  beforeEach(() => sleep.mockClear());

  it('posts the lead as JSON and returns the stored id', async () => {
    const fetchFn = vi.fn(() =>
      Promise.resolve(respond(202, { id: 'abc', status: 'accepted' })),
    );

    await expect(
      sendLead('https://api.test', lead, { fetchFn, sleep }),
    ).resolves.toEqual({ id: 'abc', status: 'accepted' });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://api.test/leads');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(lead);
  });

  it('retries a sleeping server, reporting each retry', async () => {
    const onRetry = vi.fn();
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respond(503))
      .mockResolvedValueOnce(respond(202, { id: 'abc', status: 'accepted' }));

    await sendLead('https://api.test', lead, { fetchFn, sleep, onRetry });

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(onRetry.mock.calls).toEqual([[1], [2]]);
    expect(sleep.mock.calls).toEqual([[retryDelaysMs[0]], [retryDelaysMs[1]]]);
  });

  it('gives up as unreachable once every retry is spent', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(respond(502)));

    await expect(
      sendLead('https://api.test', lead, { fetchFn, sleep }),
    ).rejects.toEqual(new LeadError('unreachable'));
    expect(fetchFn).toHaveBeenCalledTimes(retryDelaysMs.length + 1);
  });

  it('does not retry a failed spam check or an invalid lead', async () => {
    const rejected = vi.fn(() => Promise.resolve(respond(403)));
    const invalid = vi.fn(() => Promise.resolve(respond(400)));

    await expect(
      sendLead('https://api.test', lead, { fetchFn: rejected, sleep }),
    ).rejects.toMatchObject({ reason: 'rejected' });
    await expect(
      sendLead('https://api.test', lead, { fetchFn: invalid, sleep }),
    ).rejects.toMatchObject({ reason: 'invalid' });
    expect(rejected).toHaveBeenCalledTimes(1);
    expect(invalid).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries when rate limited', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(respond(429))
      .mockResolvedValueOnce(respond(202, { id: 'abc', status: 'accepted' }));

    await sendLead('https://api.test', lead, { fetchFn, sleep });

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
