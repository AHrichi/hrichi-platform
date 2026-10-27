import { Propagation, workerClass } from './propagation';
import type { FromWorker } from './protocol';

function fakeWorker() {
  let receive: ((event: MessageEvent) => void) | null = null;
  return {
    worker: {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: (_: string, listener: (event: MessageEvent) => void) =>
        (receive = listener),
    },
    emit(message: FromWorker) {
      receive?.({ data: message } as MessageEvent);
    },
  };
}

describe('Propagation', () => {
  it('turns worker messages into a feed, telemetry and paths', () => {
    const { worker, emit } = fakeWorker();
    const handlers = { catalog: vi.fn(), telemetry: vi.fn(), path: vi.fn() };
    const propagation = new Propagation(worker as unknown as Worker, handlers);

    propagation.load([]);
    propagation.requestFrame(1000, 2);
    expect(worker.postMessage).toHaveBeenCalledWith({
      type: 'catalog',
      satellites: [],
    });
    expect(worker.postMessage).toHaveBeenCalledWith({
      type: 'frame',
      time: 1000,
      selected: 2,
    });

    emit({
      type: 'catalog',
      count: 1,
      classes: new Uint8Array(1),
      groups: new Uint8Array(1),
    });
    const feed = handlers.catalog.mock.calls[0][0];
    const listener = vi.fn();
    const unsubscribe = feed.subscribe(listener);

    const frame = {
      type: 'frame' as const,
      time: 1000,
      positions: new Float32Array(3),
      gmst: 1,
      sun: [1, 0, 0] as [number, number, number],
      telemetry: null,
    };
    emit(frame);
    expect(listener).toHaveBeenCalledWith(frame);
    expect(handlers.telemetry).toHaveBeenCalledWith(null);

    unsubscribe();
    emit(frame);
    expect(listener).toHaveBeenCalledTimes(1);

    emit({ type: 'path', index: 0, positions: new Float32Array(6) });
    expect(handlers.path).toHaveBeenCalledWith(0, expect.any(Float32Array));

    propagation.dispose();
    expect(worker.terminate).toHaveBeenCalled();
  });
});

describe('workerClass', () => {
  class Recorder {
    static created: { url: string | URL; options?: WorkerOptions }[] = [];
    constructor(url: string | URL, options?: WorkerOptions) {
      Recorder.created.push({ url, options });
    }
  }

  beforeEach(() => {
    Recorder.created = [];
    vi.stubGlobal('Worker', Recorder);
    URL.createObjectURL = vi.fn(() => 'blob:trampoline');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts a same-origin script directly', () => {
    const Worker = workerClass();
    new Worker(new URL('/worker.js', location.href), { type: 'module' });

    expect(String(Recorder.created[0].url)).toBe(
      new URL('/worker.js', location.href).href,
    );
  });

  it('starts a cross-origin script through a blob module that imports it', () => {
    const Worker = workerClass();
    new Worker('https://lab-orbit.example/worker-ABC.js', { type: 'module' });

    expect(Recorder.created[0]).toEqual({
      url: 'blob:trampoline',
      options: { type: 'module' },
    });
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/javascript');
  });
});
