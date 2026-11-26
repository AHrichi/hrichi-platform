import { SYNC_LIMITS } from './limits';

/** One kind of record an app syncs. */
export interface SyncKindSpec {
  /** Its data's largest size, as JSON; at most `SYNC_LIMITS.recordBytes`. */
  readonly maxBytes: number;
}

/**
 * What an app syncs: the kinds of record, and how large each may be. The
 * server holds the data as it comes and checks only this; the app checks
 * what it pulls before it uses it.
 */
export interface SyncAppSpec {
  readonly app: string;
  readonly kinds: Readonly<Record<string, SyncKindSpec>>;
}

/** What's wrong with a spec, if anything (check it in a spec). */
export function syncSpecProblems(spec: SyncAppSpec): string[] {
  const problems: string[] = [];
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(spec.app)) {
    problems.push(`app "${spec.app}" isn't a slug`);
  }
  for (const [kind, { maxBytes }] of Object.entries(spec.kinds)) {
    if (!/^[a-z][a-z0-9-]{0,31}$/.test(kind)) {
      problems.push(`kind "${kind}" isn't a slug`);
    }
    if (!(maxBytes > 0 && maxBytes <= SYNC_LIMITS.recordBytes)) {
      problems.push(
        `kind "${kind}" may hold 1 to ${SYNC_LIMITS.recordBytes} bytes`,
      );
    }
  }
  if (Object.keys(spec.kinds).length === 0) problems.push('no kinds');
  return problems;
}
