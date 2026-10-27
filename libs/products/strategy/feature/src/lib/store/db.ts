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

let activeDbInstance: FinancialDB | null = null;
let currentDbName = 'FinancialStrategyDB2';

export function setFinancialDbName(name: string): FinancialDB {
  if (currentDbName !== name || !activeDbInstance) {
    currentDbName = name;
    activeDbInstance = new FinancialDB(name);
  }
  return activeDbInstance;
}

export function getFinancialDb(): FinancialDB {
  if (!activeDbInstance) {
    activeDbInstance = new FinancialDB(currentDbName);
  }
  return activeDbInstance;
}

export const db: FinancialDB = new Proxy({} as FinancialDB, {
  get(_target, prop) {
    const instance = getFinancialDb();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});
