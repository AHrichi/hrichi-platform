import Dexie, { Table } from 'dexie';
import { Scenario, Transaction } from './models';

export interface SettingsItem {
  key: string;
  value: unknown;
}

export class FinancialDB extends Dexie {
  scenarios!: Table<Scenario, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<SettingsItem, string>;

  constructor(dbName = 'FinancialStrategyDB2') {
    super(dbName);
    this.version(1).stores({
      scenarios: 'id',
      transactions: 'id, date, type',
      settings: 'key',
    });
    this.version(2).stores({
      scenarios: 'id',
      transactions: 'id, date, type, goalId',
      settings: 'key',
    });
  }
}
