import { type Env, handleRequest } from './worker';

/** The Workers runtime's entry point (module syntax). */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
