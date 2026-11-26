import * as v from 'valibot';

/** A device or space id: a UUID, as `crypto.randomUUID()` makes. */
export const SyncIdSchema = v.pipe(
  v.string(),
  v.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
);

/** A kind of record an app syncs: `project`, `calculation`… */
export const SyncKindSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z][a-z0-9-]{0,31}$/),
);

/** A record's key within its kind: an id, or `projectId:id`. */
export const SyncKeySchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(160),
);

/** An instant in UTC, as `toISOString()` writes it. */
export const SyncTimeSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/),
);

/**
 * One version of one record. The app turns its data into records (a
 * project, each saved result…) so that edits to different records on two
 * devices both survive. A deletion is a record with `deleted` and no data,
 * so other devices learn of it.
 */
export const SyncRecordSchema = v.strictObject({
  kind: SyncKindSchema,
  key: SyncKeySchema,
  updatedAt: SyncTimeSchema,
  /** The device that wrote this version. */
  by: SyncIdSchema,
  deleted: v.optional(v.boolean()),
  data: v.optional(v.unknown()),
});

export type SyncRecord = v.InferOutput<typeof SyncRecordSchema>;

/** A record as the server keeps it: with its place in the space's order. */
export interface StoredRecord extends SyncRecord {
  readonly seq: number;
}

/** Who wrote a version, and when. */
export interface Revision {
  readonly updatedAt: string;
  readonly by: string;
}

/**
 * The later edit wins; on a tie, the larger device id, so every device and
 * the server pick the same version whatever order copies arrive in.
 */
export function compareRevisions(a: Revision, b: Revision): number {
  const byTime = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  if (byTime !== 0) return Math.sign(byTime);
  if (a.by === b.by) return 0;
  return a.by < b.by ? -1 : 1;
}

/** Whether `incoming` replaces `current` (none yet: always). */
export function incomingWins(
  current: Revision | null | undefined,
  incoming: Revision,
): boolean {
  return !current || compareRevisions(incoming, current) > 0;
}

/** One map key for a record, whatever its kind. */
export function recordId(record: { kind: string; key: string }): string {
  return `${record.kind}\u0000${record.key}`;
}
