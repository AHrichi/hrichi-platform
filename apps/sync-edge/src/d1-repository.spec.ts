import { runSyncRepositoryContract } from '@ah/shared/sync-server/testing';
import { sqliteD1 } from '../tests/sqlite-d1';
import { D1SyncRepository } from './d1-repository';

runSyncRepositoryContract(
  'D1 (SQLite)',
  async () => new D1SyncRepository(sqliteD1()),
);
