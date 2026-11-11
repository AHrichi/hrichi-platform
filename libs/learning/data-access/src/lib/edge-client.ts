import type { NudgeState } from '@ah/learning/domain';

type Fetch = typeof fetch;

/**
 * The edge Worker (design §10): the app tells it when nudges make sense.
 * Fire and forget: a failure only means the next nudge uses older state.
 */
export class EdgeClient {
  private readonly base: string;

  constructor(
    edgeUrl: string,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.base = edgeUrl.replace(/\/+$/, '');
  }

  async putNudgeState(state: NudgeState, token: string): Promise<boolean> {
    try {
      const response = await this.fetchFn(`${this.base}/state`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(state),
        signal: AbortSignal.timeout(10_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
