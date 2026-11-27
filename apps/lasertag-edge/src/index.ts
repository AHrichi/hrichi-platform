import { type Env, handleRequest, sweep } from './worker';

/** The Workers runtime's entry point (module syntax). */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
  /** Daily: expired guests and abandoned passkey ceremonies. */
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await sweep(env);
  },
};
