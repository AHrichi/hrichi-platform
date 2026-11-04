import { describe, expect, it } from 'vitest';
import {
  executeInBatches,
  type BatchExecutionProgress,
} from './batch-execution';

describe('executeInBatches', () => {
  it('processes all items in batches when all succeed', async () => {
    const items = [1, 2, 3, 4, 5];
    const progressUpdates: BatchExecutionProgress[] = [];

    const result = await executeInBatches(
      items,
      async (item) => `result-${item}`,
      {
        batchSize: 2,
        onProgress: (p) => progressUpdates.push({ ...p }),
      },
    );

    expect(result.cancelled).toBe(false);
    expect(result.succeeded).toHaveLength(5);
    expect(result.failed).toHaveLength(0);
    expect(result.succeeded.map((s) => s.result)).toEqual([
      'result-1',
      'result-2',
      'result-3',
      'result-4',
      'result-5',
    ]);
    expect(progressUpdates.at(-1)?.percentage).toBe(100);
    expect(progressUpdates.at(-1)?.totalBatches).toBe(3);
  });

  it('retries failing tasks up to maxRetries and succeeds if a retry succeeds', async () => {
    const attemptsPerItem = new Map<number, number>();
    const retryCalls: { item: number; attempt: number }[] = [];

    const items = [1, 2];
    const result = await executeInBatches(
      items,
      async (item) => {
        const count = (attemptsPerItem.get(item) ?? 0) + 1;
        attemptsPerItem.set(item, count);
        if (item === 2 && count === 1) {
          throw new Error('Temporary 503 error');
        }
        return `success-${item}`;
      },
      {
        batchSize: 2,
        maxRetries: 2,
        retryDelayMs: 10,
        onItemRetry: (item, attempt) => {
          retryCalls.push({ item, attempt });
        },
      },
    );

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
    expect(attemptsPerItem.get(2)).toBe(2);
    expect(retryCalls).toEqual([{ item: 2, attempt: 1 }]);
  });

  it('records failure after maxRetries are exhausted', async () => {
    const items = ['a', 'b'];
    const retryCalls: { item: string; attempt: number }[] = [];

    const result = await executeInBatches(
      items,
      async (item) => {
        if (item === 'b') {
          throw new Error('Persistent failure');
        }
        return `ok-${item}`;
      },
      {
        batchSize: 1,
        maxRetries: 2,
        retryDelayMs: 10,
        onItemRetry: (item, attempt) => {
          retryCalls.push({ item, attempt });
        },
      },
    );

    expect(result.succeeded).toHaveLength(1);
    expect(result.succeeded[0].item).toBe('a');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].item).toBe('b');
    expect(result.failed[0].error).toBe('Persistent failure');
    expect(result.failed[0].attempts).toBe(3); // Initial + 2 retries
    expect(retryCalls).toHaveLength(2);
  });

  it('stops processing when aborted via AbortSignal', async () => {
    const controller = new AbortController();
    const items = [1, 2, 3, 4, 5, 6];
    let executedCount = 0;

    const promise = executeInBatches(
      items,
      async (item) => {
        executedCount++;
        if (item === 2) {
          controller.abort();
        }
        return item;
      },
      {
        batchSize: 2,
        signal: controller.signal,
      },
    );

    const result = await promise;
    expect(result.cancelled).toBe(true);
    // Batch 1 (items 1 & 2) was processed, but batches 2 and 3 should not run
    expect(executedCount).toBe(2);
  });

  it('handles empty item list gracefully', async () => {
    const result = await executeInBatches([], async () => 'nope');
    expect(result.succeeded).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(result.cancelled).toBe(false);
  });
});
