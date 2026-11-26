import { type Env, handleRequest, sweep } from './worker';

/** The Workers runtime's entry points (module syntax). */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
  /** Daily: spent codes, and spaces idle for a year. */
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await sweep(env);
  },
};
