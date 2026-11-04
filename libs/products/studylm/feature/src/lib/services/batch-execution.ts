export interface BatchExecutionProgress {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  retried: number;
  currentBatch: number;
  totalBatches: number;
  percentage: number;
}

export interface BatchItemError<T> {
  item: T;
  error: string;
  attempts: number;
}

export interface BatchExecutionResult<T, R> {
  succeeded: { item: T; result: R }[];
  failed: BatchItemError<T>[];
  cancelled: boolean;
}

export interface BatchExecutionOptions<T> {
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  onProgress?: (progress: BatchExecutionProgress) => void;
  onItemRetry?: (item: T, attempt: number, error: unknown) => void;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Operation cancelled'));
      return;
    }
    const timer = setTimeout(() => {
      resolve();
    }, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Operation cancelled'));
      },
      { once: true },
    );
  });
}

/**
 * Executes a task over a list of items in concurrent batches, with an
 * automated retry mechanism that catches errors and retries with backoff.
 */
export async function executeInBatches<T, R>(
  items: T[],
  task: (item: T, attempt: number, signal: AbortSignal) => Promise<R>,
  options: BatchExecutionOptions<T> = {},
): Promise<BatchExecutionResult<T, R>> {
  const batchSize = Math.max(1, options.batchSize ?? 2);
  const maxRetries = Math.max(0, options.maxRetries ?? 2);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 1000);
  const signal = options.signal ?? new AbortController().signal;

  const total = items.length;
  const succeeded: { item: T; result: R }[] = [];
  const failed: BatchItemError<T>[] = [];
  let completed = 0;
  let retried = 0;

  const totalBatches = Math.ceil(total / batchSize);

  function notify(currentBatch: number) {
    const percentage =
      total === 0 ? 100 : Math.round((completed / total) * 100);
    options.onProgress?.({
      total,
      completed,
      succeeded: succeeded.length,
      failed: failed.length,
      retried,
      currentBatch,
      totalBatches,
      percentage,
    });
  }

  notify(0);

  for (let b = 0; b < totalBatches; b++) {
    if (signal.aborted) {
      break;
    }

    const currentBatchNum = b + 1;
    const batchItems = items.slice(b * batchSize, (b + 1) * batchSize);

    await Promise.all(
      batchItems.map(async (item) => {
        let attempt = 1;
        while (attempt <= maxRetries + 1) {
          if (signal.aborted) {
            return;
          }
          try {
            const result = await task(item, attempt, signal);
            succeeded.push({ item, result });
            completed++;
            notify(currentBatchNum);
            return;
          } catch (err) {
            if (signal.aborted) {
              return;
            }
            if (attempt <= maxRetries) {
              retried++;
              options.onItemRetry?.(item, attempt, err);
              notify(currentBatchNum);
              try {
                await delay(retryDelayMs * Math.pow(1.5, attempt - 1), signal);
              } catch {
                return;
              }
              attempt++;
            } else {
              failed.push({
                item,
                error: err instanceof Error ? err.message : String(err),
                attempts: attempt,
              });
              completed++;
              notify(currentBatchNum);
              return;
            }
          }
        }
      }),
    );
  }

  return {
    succeeded,
    failed,
    cancelled: signal.aborted,
  };
}
