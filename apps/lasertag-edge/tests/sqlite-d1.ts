import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '../src/d1-repository';

const MIGRATIONS = new URL('../migrations/', import.meta.url);

/**
 * D1's interface over Node's own SQLite, with every migration applied in
 * order: the D1 store's tests run on the SQL engine D1 uses, without
 * Cloudflare. `batch` is one transaction, as D1's is.
 */
export function sqliteD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(file, MIGRATIONS), 'utf8'));
  }

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
      return {
        results: db.prepare(this.sql).all(...values(this.params)) as T[],
        meta: {},
      };
    }

    async first<T>(): Promise<T | null> {
      return (db.prepare(this.sql).get(...values(this.params)) as T) ?? null;
    }

    async run(): Promise<D1Result> {
      return this.runSync();
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
