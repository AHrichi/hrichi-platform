import type { Omm } from '@ah/labs/orbit/domain';
import type { OrbitFeed, OrbitFrame } from '@ah/three/scenes/orbit-globe';
import type { FromWorker, Telemetry, ToWorker } from './protocol';

/**
 * Starts the propagation worker.
 *
 * Browsers start workers only from the page's own origin, and inside the
 * shell this remote's scripts come from another one. So a cross-origin
 * script is started through a same-origin `blob:` module that imports it
 * (ADR-0014); the shell's CSP allows `worker-src blob:`.
 */
export function startPropagationWorker(): Worker {
  // Shadows the global so Angular still finds and bundles the worker below.
  const Worker = workerClass();
  return new Worker(new URL('./propagation.worker', import.meta.url), {
    type: 'module',
  });
}

/** `Worker`, made to start cross-origin module scripts too. */
export function workerClass(): typeof globalThis.Worker {
  const Native = globalThis.Worker;
  return class extends Native {
    constructor(url: string | URL, options?: WorkerOptions) {
      const script = new URL(url, globalThis.location.href);
      if (script.origin === globalThis.location.origin) {
        super(script, options);
        return;
      }
      const trampoline = new Blob([`import ${JSON.stringify(script.href)};`], {
        type: 'text/javascript',
      });
      super(URL.createObjectURL(trampoline), { ...options, type: 'module' });
    }
  };
}

/**
 * The page's side of the worker: sends it the catalog and frame requests,
 * and hands frames to the globe as an OrbitFeed.
 */
export class Propagation {
  private readonly frameListeners = new Set<(frame: OrbitFrame) => void>();

  constructor(
    private readonly worker: Pick<
      Worker,
      'postMessage' | 'addEventListener' | 'terminate'
    >,
    private readonly handlers: {
      catalog(feed: OrbitFeed): void;
      telemetry(telemetry: Telemetry | null): void;
      path(index: number, positions: Float32Array): void;
    },
  ) {
    worker.addEventListener('message', (event) =>
      this.receive((event as MessageEvent<FromWorker>).data),
    );
  }

  load(satellites: Omm[]): void {
    this.post({ type: 'catalog', satellites });
  }

  requestFrame(time: number, selected: number | null): void {
    this.post({ type: 'frame', time, selected });
  }

  requestPath(index: number, time: number): void {
    this.post({ type: 'path', index, time });
  }

  dispose(): void {
    this.frameListeners.clear();
    this.worker.terminate();
  }

  private post(message: ToWorker): void {
    this.worker.postMessage(message);
  }

  private receive(message: FromWorker): void {
    switch (message.type) {
      case 'catalog':
        this.frameListeners.clear();
        this.handlers.catalog({
          count: message.count,
          classes: message.classes,
          groups: message.groups,
          subscribe: (listener) => {
            this.frameListeners.add(listener);
            return () => this.frameListeners.delete(listener);
          },
        });
        break;
      case 'frame':
        for (const listener of this.frameListeners) {
          listener(message);
        }
        this.handlers.telemetry(message.telemetry);
        break;
      case 'path':
        this.handlers.path(message.index, message.positions);
        break;
    }
  }
}
