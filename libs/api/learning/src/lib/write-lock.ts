/**
 * Runs writes to the learning records one at a time in this process.
 *
 * Sequence numbers are taken in order and written before the next write
 * starts, so a device reading the change feed never sees seq 11 while
 * seq 10 is still being written and skips it for good. Syncs and the
 * capture pipeline share one lock. The API runs as a single instance on
 * Render; a second instance would need a lock in the database instead.
 */
export class WriteLock {
  private queue: Promise<unknown> = Promise.resolve();

  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.catch(() => undefined);
    return result;
  }
}
