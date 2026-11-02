import type { BlockOf } from '../spec/blocks';
import type { OpOf } from './contracts';
import { upTo } from './steps';

type HashBlock = BlockOf<'hash-table'>;

/** The bucket a key goes to; null when the hash can't compute it ("given"). */
export function bucketOf(
  key: string,
  hash: HashBlock['hash'],
  buckets: number,
): number | null {
  if (hash === 'mod') {
    if (!/^-?\d+$/.test(key)) return null;
    return ((Number(key) % buckets) + buckets) % buckets;
  }
  if (hash === 'char-sum-mod') {
    let sum = 0;
    for (const char of key) sum += char.codePointAt(0) ?? 0;
    return sum % buckets;
  }
  return null;
}

export interface HashEntry {
  key: string;
  value: string | null;
}

export interface HashState {
  buckets: HashEntry[][];
  /** This step only. */
  active: { bucket: number; key: string | null } | null;
  /** For a lookup: whether the key was there. */
  found: boolean | null;
  resized: boolean;
}

/** What one op does to the buckets; shared with the validator's replay. */
export function applyHashOp(
  buckets: HashEntry[][],
  o: OpOf<'hash-table'>,
  hash: HashBlock['hash'],
): { buckets: HashEntry[][]; bucket: number; found: boolean | null } {
  const size = buckets.length;
  const where = (key: string, given: number | null) =>
    given ?? bucketOf(key, hash, size) ?? 0;
  switch (o.op) {
    case 'insert': {
      const b = where(o.key ?? '', o.bucket);
      const chain = buckets[b] ?? [];
      const existing = chain.find((e) => e.key === o.key);
      if (existing) existing.value = o.value;
      else chain.push({ key: o.key ?? '', value: o.value });
      return { buckets, bucket: b, found: null };
    }
    case 'lookup': {
      const b = where(o.key ?? '', o.bucket);
      return {
        buckets,
        bucket: b,
        found: (buckets[b] ?? []).some((e) => e.key === o.key),
      };
    }
    case 'delete': {
      const b = where(o.key ?? '', o.bucket);
      buckets[b] = (buckets[b] ?? []).filter((e) => e.key !== o.key);
      return { buckets, bucket: b, found: null };
    }
    case 'resize': {
      const next: HashEntry[][] = Array.from(
        { length: o.size ?? size },
        () => [],
      );
      for (const entry of buckets.flat()) {
        next[bucketOf(entry.key, hash, next.length) ?? 0].push(entry);
      }
      return { buckets: next, bucket: -1, found: null };
    }
  }
}

export function hashStateAt(block: HashBlock, n: number): HashState {
  let buckets: HashEntry[][] = Array.from({ length: block.buckets }, () => []);
  const state: HashState = {
    buckets,
    active: null,
    found: null,
    resized: false,
  };
  upTo(block.steps, n, (o, current) => {
    const result = applyHashOp(buckets, o, block.hash);
    buckets = result.buckets;
    if (!current) return;
    state.active = { bucket: result.bucket, key: o.key };
    state.found = result.found;
    state.resized = o.op === 'resize';
  });
  state.buckets = buckets;
  return state;
}
