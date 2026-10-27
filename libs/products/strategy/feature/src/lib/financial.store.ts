import { signalStore, withState } from '@ngrx/signals';
import { initialState } from './store/initial-state';
import { withFinancialComputeds } from './store/computeds';
import { withFinancialMethods } from './store/methods';
import { withFinancialHooks } from './store/hooks';

export * from './store/models';
export { db, FinancialDB } from './store/db';

export const FinancialStore = signalStore(
  withState(initialState),
  withFinancialComputeds(),
  withFinancialMethods(),
  withFinancialHooks(),
);
