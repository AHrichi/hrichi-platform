import { effect, inject, Injector } from '@angular/core';
import {
  getState,
  patchState,
  signalStoreFeature,
  type,
  withHooks,
} from '@ngrx/signals';
import { Subject, from, of } from 'rxjs';
import { debounceTime, concatMap, catchError } from 'rxjs/operators';
import { APP_MODE } from '@ah/platform/app-mode';
import { db, setFinancialDbName } from './db';
import { initialState } from './initial-state';
import { Account, Category, FinancialState, Transaction } from './models';
import { ToastService } from '../services/toast.service';

function computeBalance(
  accounts: Account[],
  transactions: Transaction[],
): number {
  let total = 0;
  for (const account of accounts) {
    let net = 0;
    for (const t of transactions) {
      if (t.type === 'income' && t.accountId === account.id) net += t.amount;
      else if (t.type === 'expense' && t.accountId === account.id)
        net -= t.amount;
      else if (t.type === 'transfer') {
        if (t.fromAccountId === account.id) net -= t.amount;
        if (t.accountId === account.id) net += t.amount;
      }
    }
    total += account.initialBalance + net;
  }
  return total;
}

export function withFinancialHooks() {
  return signalStoreFeature(
    { state: type<FinancialState>() },
    withHooks({
      onInit(store) {
        const injector = inject(Injector);
        const toast = inject(ToastService);
        const appMode = inject(APP_MODE, { optional: true }) ?? 'standalone';
        const dbName =
          appMode === 'embedded-demo'
            ? 'ah-demo-strategy'
            : 'FinancialStrategyDB2';
        setFinancialDbName(dbName);

        const log = (msg: string, ...args: unknown[]) =>
          console.log(`[DB:${dbName}] ${msg}`, ...args);

        const saveToDexie = async (state: FinancialState): Promise<boolean> => {
          try {
            await db.transaction(
              'rw',
              db.scenarios,
              db.transactions,
              db.settings,
              async () => {
                const existingScenarioIds = await db.scenarios
                  .toCollection()
                  .primaryKeys();
                const existingTransactionIds = await db.transactions
                  .toCollection()
                  .primaryKeys();

                if (state.scenarios.length > 0)
                  await db.scenarios.bulkPut(state.scenarios);
                if (state.transactions.length > 0)
                  await db.transactions.bulkPut(state.transactions);

                const newScenarioIds = new Set(
                  state.scenarios.map((s) => s.id),
                );
                const staleScenarioIds = (
                  existingScenarioIds as string[]
                ).filter((id) => !newScenarioIds.has(id));
                if (staleScenarioIds.length > 0)
                  await db.scenarios.bulkDelete(staleScenarioIds);

                const newTransactionIds = new Set(
                  state.transactions.map((t) => t.id),
                );
                const staleTransactionIds = (
                  existingTransactionIds as string[]
                ).filter((id) => !newTransactionIds.has(id));
                if (staleTransactionIds.length > 0)
                  await db.transactions.bulkDelete(staleTransactionIds);

                await Promise.all([
                  state.accounts.length > 0
                    ? db.settings.put({
                        key: 'accounts',
                        value: state.accounts,
                      })
                    : Promise.resolve(),
                  db.settings.put({
                    key: 'categories',
                    value: state.categories,
                  }),
                  db.settings.put({ key: 'budgets', value: state.budgets }),
                  db.settings.put({
                    key: 'activeScenarioId',
                    value: state.activeScenarioId || '',
                  }),
                ]);
              },
            );
            return true;
          } catch (err) {
            console.error('[DB] saveToDexie failed:', err);
            toast.show('Failed to save data', 'error', 5000);
            return false;
          }
        };

        const initializeData = async () => {
          try {
            const scenarioCount = await db.scenarios.count();
            log('scenarios in Dexie:', scenarioCount);

            if (scenarioCount === 0) {
              log('Seeding initial state in Dexie...');
              patchState(store, initialState);
              await saveToDexie(initialState);
            } else {
              const scenarios = await db.scenarios.toArray();
              const transactions: Transaction[] = (
                await db.transactions.toArray()
              ).map((t) => ({
                ...t,
                accountId: t.accountId || '',
              }));
              const accountsRec = await db.settings.get('accounts');
              const categoriesRec = await db.settings.get('categories');
              const activeIdRec = await db.settings.get('activeScenarioId');
              const budgetsRec = await db.settings.get('budgets');
              const rawBudgets = budgetsRec?.value as
                FinancialState['budgets'] | undefined;
              const rawAccounts = accountsRec?.value as Account[] | undefined;
              const accounts = rawAccounts?.length
                ? rawAccounts
                : [
                    {
                      id: crypto.randomUUID(),
                      name: 'Cash',
                      type: 'cash' as const,
                      initialBalance: 0,
                    },
                  ];
              const rawCategories = categoriesRec?.value as
                Category[] | undefined;
              const categories = rawCategories?.length ? rawCategories : [];

              const defaultId = accounts[0].id;
              const patched = transactions.map((t) => ({
                ...t,
                accountId: t.accountId || defaultId,
              }));

              patchState(store, {
                scenarios,
                transactions: patched,
                accounts,
                categories,
                budgets: rawBudgets || [],
                currentBalance: computeBalance(accounts, patched),
                activeScenarioId:
                  (activeIdRec?.value as string) || scenarios[0]?.id,
              });
            }
          } catch (err) {
            console.error(
              '[DB] Failed to load initial state from Dexie, attempting recovery...',
              err,
            );
            try {
              await db.delete();
              await db.open();
              patchState(store, initialState);
              await saveToDexie(initialState);
              log('Dexie database recreated successfully');
            } catch (recoveryErr) {
              console.error(
                '[DB] Failed to recover Dexie database',
                recoveryErr,
              );
            }
          }
        };

        // Wait for init before setting up auto-save to prevent race conditions
        initializeData().then(() => {
          log('initialized, starting auto-save');
          const saveSubject = new Subject<FinancialState>();
          saveSubject
            .pipe(
              debounceTime(500),
              concatMap((state) =>
                from(saveToDexie(state)).pipe(
                  catchError((err) => {
                    console.error('[DB] save stream error:', err);
                    return of(false);
                  }),
                ),
              ),
            )
            .subscribe();

          effect(
            () => {
              const state = getState(store) as FinancialState;
              saveSubject.next(state);
            },
            { injector },
          );
        });
      },
    }),
  );
}
