import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '../src/d1-repository';

/**
 * D1's interface over Node's own SQLite, with the Worker's migrations
 * applied: the D1 store's tests run on the same SQL engine D1 uses,
 * without Cloudflare. `batch` is one transaction, as D1's is.
 */
export function sqliteD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(
    readFileSync(
      new URL('../migrations/0001_init.sql', import.meta.url),
      'utf8',
    ),
  );

  const values = (params: unknown[]): SQLInputValue[] =>
    params.map((value) => {
      if (value === undefined) return null;
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value as SQLInputValue;
    });

  class Statement implements D1PreparedStatement {
    constructor(
      private readonly sql: string,
      private readonly params: unknown[] = [],
    ) {}

    bind(...params: unknown[]): D1PreparedStatement {
      return new Statement(this.sql, params);
    }

    async all<T>(): Promise<D1Result<T>> {
      return { results: this.allSync() as T[], meta: {} };
    }

    async first<T>(): Promise<T | null> {
      return (db.prepare(this.sql).get(...values(this.params)) as T) ?? null;
    }

    async run(): Promise<D1Result> {
      return this.runSync();
    }

    allSync(): unknown[] {
      return db.prepare(this.sql).all(...values(this.params));
    }

    runSync(): D1Result {
      const result = db.prepare(this.sql).run(...values(this.params));
      return { results: [], meta: { changes: Number(result.changes) } };
    }
  }

  return {
    prepare: (sql) => new Statement(sql),
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const results = statements.map((s) => (s as Statement).runSync());
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
