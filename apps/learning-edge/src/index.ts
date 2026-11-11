import { type Env, handleRequest, handleScheduled } from './worker';

/** The Workers runtime's entry points (module syntax). */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(
    controller: { scheduledTime: number },
    env: Env,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<void> {
    ctx.waitUntil(handleScheduled(env, new Date(controller.scheduledTime)));
  },
};
