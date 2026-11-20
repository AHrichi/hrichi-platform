import Dexie, { type Table } from 'dexie';

export interface MetaRow {
  key: string;
  value: unknown;
}

/**
 * The app's IndexedDB database. Its name comes from the feature layer
 * (`databaseName()` in `@ah/platform/storage`), so the portfolio demo opens
 * `ah-demo-system-design` and never the standalone data. Phase P5 adds the
 * progress, attempts and designs tables; nothing has shipped yet, so it may
 * redefine version 1.
 */
export class SystemDesignDatabase extends Dexie {
  meta!: Table<MetaRow, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ meta: 'key' });
  }
}
