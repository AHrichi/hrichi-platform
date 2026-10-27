import {
  patchState,
  signalStoreFeature,
  type,
  withMethods,
} from '@ngrx/signals';
import {
  Account,
  Budget,
  Category,
  Expense,
  FinancialState,
  Goal,
  IncomeSource,
  ImportPayload,
  Loan,
  Scenario,
  Transaction,
} from './models';
import { currentYearMonth, initialState } from './initial-state';
import { getFinancialDb } from './db';

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

export function withFinancialMethods() {
  return signalStoreFeature(
    { state: type<FinancialState>() },
    withMethods((store) => {
      const updateActiveScenario = (
        updater: (scenario: Scenario) => Scenario,
      ) => {
        patchState(store, (state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === state.activeScenarioId ? updater(s) : s,
          ),
        }));
      };

      return {
        applyIncomeToScenarios(payload: {
          income: Omit<IncomeSource, 'id' | 'isEnabled'>;
          targetScenarioIds: string[];
        }) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) => {
              if (payload.targetScenarioIds.includes(s.id)) {
                return {
                  ...s,
                  incomes: [
                    ...s.incomes,
                    {
                      ...payload.income,
                      id: crypto.randomUUID(),
                      isEnabled: true,
                    },
                  ],
                };
              }
              return s;
            }),
          }));
        },
        applyExpenseToScenarios(payload: {
          expense: Omit<Expense, 'id' | 'isEnabled'>;
          targetScenarioIds: string[];
        }) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) => {
              if (payload.targetScenarioIds.includes(s.id)) {
                return {
                  ...s,
                  expenses: [
                    ...s.expenses,
                    {
                      ...payload.expense,
                      id: crypto.randomUUID(),
                      isEnabled: true,
                    },
                  ],
                };
              }
              return s;
            }),
          }));
        },
        applyGoalToScenarios(payload: {
          goal: Omit<Goal, 'id' | 'isEnabled'>;
          targetScenarioIds: string[];
        }) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) => {
              if (payload.targetScenarioIds.includes(s.id)) {
                return {
                  ...s,
                  goals: [
                    ...s.goals,
                    {
                      ...payload.goal,
                      id: crypto.randomUUID(),
                      isEnabled: true,
                    },
                  ],
                };
              }
              return s;
            }),
          }));
        },
        addAccount(
          name: string,
          type: Account['type'],
          initialBalance: number,
        ) {
          patchState(store, (state) => {
            const newAccount: Account = {
              id: crypto.randomUUID(),
              name,
              type,
              initialBalance,
            };
            const accounts = [...state.accounts, newAccount];
            return {
              accounts,
              currentBalance: computeBalance(accounts, state.transactions),
            };
          });
        },
        removeAccount(id: string) {
          patchState(store, (state) => {
            const accounts = state.accounts.filter((a) => a.id !== id);
            return {
              accounts,
              currentBalance: computeBalance(accounts, state.transactions),
            };
          });
        },
        updateAccount(id: string, data: Partial<Omit<Account, 'id'>>) {
          patchState(store, (state) => {
            const accounts = state.accounts.map((a) =>
              a.id === id ? { ...a, ...data } : a,
            );
            return {
              accounts,
              currentBalance: computeBalance(accounts, state.transactions),
            };
          });
        },
        addTransaction(transaction: Omit<Transaction, 'id'>) {
          patchState(store, (state) => {
            const transactions = [
              ...state.transactions,
              { ...transaction, id: crypto.randomUUID() },
            ];
            return {
              transactions,
              currentBalance: computeBalance(state.accounts, transactions),
            };
          });
        },
        removeTransaction(id: string) {
          patchState(store, (state) => {
            const transactions = state.transactions.filter((t) => t.id !== id);
            return {
              transactions,
              currentBalance: computeBalance(state.accounts, transactions),
            };
          });
        },
        updateTransaction(id: string, data: Omit<Transaction, 'id'>) {
          patchState(store, (state) => {
            const transactions = state.transactions.map((t) =>
              t.id === id ? { ...data, id } : t,
            );
            return {
              transactions,
              currentBalance: computeBalance(state.accounts, transactions),
            };
          });
        },

        reorderGoals(sId: string, previousIndex: number, currentIndex: number) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) => {
              if (s.id !== sId) return s;
              const newGoals = [...s.goals];
              const [movedItem] = newGoals.splice(previousIndex, 1);
              newGoals.splice(currentIndex, 0, movedItem);
              return { ...s, goals: newGoals };
            }),
          }));
        },
        duplicateScenario(id: string) {
          patchState(store, (state) => {
            const src = state.scenarios.find((s) => s.id === id);
            if (!src) return state;
            const duplicate: Scenario = {
              ...src,
              id: crypto.randomUUID(),
              name: `${src.name} (Copy)`,
              startDate: currentYearMonth,
              incomes: src.incomes.map((i) => ({
                ...i,
                id: crypto.randomUUID(),
              })),
              expenses: src.expenses.map((e) => ({
                ...e,
                id: crypto.randomUUID(),
              })),
              goals: src.goals.map((g) => ({ ...g, id: crypto.randomUUID() })),
              loans: (src.loans || []).map((l) => ({
                ...l,
                id: crypto.randomUUID(),
              })),
            };
            return {
              scenarios: [...state.scenarios, duplicate],
              activeScenarioId: duplicate.id,
            };
          });
        },
        loadState(newState: FinancialState) {
          const accounts = newState.accounts?.length
            ? newState.accounts
            : [
                {
                  id: crypto.randomUUID(),
                  name: 'Cash',
                  type: 'cash' as const,
                  initialBalance: newState.currentBalance || 0,
                },
              ];
          const categories = newState.categories?.length
            ? newState.categories
            : [];
          patchState(store, {
            ...newState,
            accounts,
            categories,
            currentBalance: computeBalance(
              accounts,
              newState.transactions || [],
            ),
          });
        },
        addBudget(budget: Omit<Budget, 'id'>) {
          patchState(store, (state) => ({
            budgets: [...state.budgets, { ...budget, id: crypto.randomUUID() }],
          }));
        },
        updateBudget(id: string, data: Partial<Omit<Budget, 'id'>>) {
          patchState(store, (state) => ({
            budgets: state.budgets.map((b) =>
              b.id === id ? { ...b, ...data } : b,
            ),
          }));
        },
        removeBudget(id: string) {
          patchState(store, (state) => ({
            budgets: state.budgets.filter((b) => b.id !== id),
          }));
        },
        bulkImportData(data: ImportPayload) {
          patchState(store, (state) => {
            const existingAccountNames = new Set(
              state.accounts.map((a) => a.name.toLowerCase()),
            );
            const newAccounts: Account[] = data.accounts
              .filter((a) => !existingAccountNames.has(a.name.toLowerCase()))
              .map((a) => ({
                id: crypto.randomUUID(),
                name: a.name,
                type: 'cash' as const,
                initialBalance: 0,
              }));
            const allAccounts: Account[] = [...state.accounts, ...newAccounts];
            const accountMap = new Map(
              allAccounts.map((a) => [a.name.toLowerCase(), a.id]),
            );

            const existingCategoryNames = new Set(
              state.categories.map((c) => c.name.toLowerCase()),
            );
            const newCats: Category[] = [];
            const allCatLookup = () => [...state.categories, ...newCats];
            for (const c of data.categories) {
              if (existingCategoryNames.has(c.name.toLowerCase())) continue;
              const parentId: string | null = c.parentName
                ? allCatLookup().find(
                    (p) => p.name.toLowerCase() === c.parentName!.toLowerCase(),
                  )?.id || null
                : null;
              newCats.push({
                id: crypto.randomUUID(),
                name: c.name,
                icon: c.icon,
                type: c.type,
                parentId,
              });
            }
            const allCategories: Category[] = [...state.categories, ...newCats];
            const categoryMap = new Map(
              allCategories.map((c) => [c.name.toLowerCase(), c.id]),
            );

            const newTransactions: Transaction[] = [];
            for (const t of data.transactions) {
              const accountId = accountMap.get(t.accountName.toLowerCase());
              if (!accountId) continue;
              newTransactions.push({
                id: crypto.randomUUID(),
                date: t.date,
                amount: t.amount,
                type: t.type,
                accountId,
                categoryId: categoryMap.get(t.categoryName.toLowerCase()),
                note: t.note,
              });
            }

            return {
              accounts: allAccounts,
              categories: allCategories,
              transactions: [...state.transactions, ...newTransactions],
              currentBalance: computeBalance(allAccounts, [
                ...state.transactions,
                ...newTransactions,
              ]),
            };
          });
        },
        addCategory(cat: Omit<Category, 'id'>) {
          patchState(store, (state) => ({
            categories: [
              ...state.categories,
              { ...cat, id: crypto.randomUUID() },
            ],
          }));
        },
        removeCategory(id: string) {
          patchState(store, (state) => ({
            categories: state.categories.filter(
              (c) => c.id !== id && c.parentId !== id,
            ),
          }));
        },
        updateCategory(id: string, data: Partial<Omit<Category, 'id'>>) {
          patchState(store, (state) => ({
            categories: state.categories.map((c) =>
              c.id === id ? { ...c, ...data } : c,
            ),
          }));
        },
        addScenario(name: string) {
          const newScenario: Scenario = {
            id: crypto.randomUUID(),
            name,
            startDate: currentYearMonth,
            projectionYears: 5,
            inflationRate: 0,
            investmentYield: 0,
            incomes: [
              {
                id: crypto.randomUUID(),
                name: 'Primary Salary',
                amount: 2000,
                startMonth: 1,
                endMonth: null,
                growthType: 'none',
                growthValue: 0,
                isEnabled: true,
              },
            ],
            expenses: [],
            goals: [],
            loans: [],
          };
          patchState(store, (state) => ({
            scenarios: [...state.scenarios, newScenario],
            activeScenarioId: newScenario.id,
          }));
        },
        setActiveScenario(id: string) {
          patchState(store, { activeScenarioId: id });
        },
        deleteScenario(id: string) {
          patchState(store, (state) => {
            const remaining = state.scenarios.filter((s) => s.id !== id);
            return {
              scenarios: remaining,
              activeScenarioId: remaining.length > 0 ? remaining[0].id : '',
            };
          });
        },

        updateProjectionYears(val: number) {
          updateActiveScenario((s) => ({ ...s, projectionYears: val }));
        },
        updateInflationRate(val: number) {
          updateActiveScenario((s) => ({ ...s, inflationRate: val }));
        },
        updateInvestmentYield(val: number) {
          updateActiveScenario((s) => ({ ...s, investmentYield: val }));
        },
        updateStartDate(val: string) {
          updateActiveScenario((s) => ({ ...s, startDate: val }));
        },
        updateSpecificScenarioName(id: string, name: string) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, name } : s,
            ),
          }));
        },
        updateSpecificScenarioYears(id: string, val: number) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, projectionYears: val } : s,
            ),
          }));
        },
        updateSpecificScenarioInflation(id: string, val: number) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, inflationRate: val } : s,
            ),
          }));
        },
        updateSpecificScenarioYield(id: string, val: number) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, investmentYield: val } : s,
            ),
          }));
        },

        toggleIncome(sId: string, iId: string) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === sId
                ? {
                    ...s,
                    incomes: s.incomes.map((i) =>
                      i.id === iId
                        ? {
                            ...i,
                            isEnabled: i.isEnabled === false ? true : false,
                          }
                        : i,
                    ),
                  }
                : s,
            ),
          }));
        },
        toggleExpense(sId: string, iId: string) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === sId
                ? {
                    ...s,
                    expenses: s.expenses.map((e) =>
                      e.id === iId
                        ? {
                            ...e,
                            isEnabled: e.isEnabled === false ? true : false,
                          }
                        : e,
                    ),
                  }
                : s,
            ),
          }));
        },
        toggleGoal(sId: string, iId: string) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === sId
                ? {
                    ...s,
                    goals: s.goals.map((g) =>
                      g.id === iId
                        ? {
                            ...g,
                            isEnabled: g.isEnabled === false ? true : false,
                          }
                        : g,
                    ),
                  }
                : s,
            ),
          }));
        },
        toggleLoan(sId: string, iId: string) {
          patchState(store, (state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === sId
                ? {
                    ...s,
                    loans: (s.loans || []).map((l) =>
                      l.id === iId
                        ? {
                            ...l,
                            isEnabled: l.isEnabled === false ? true : false,
                          }
                        : l,
                    ),
                  }
                : s,
            ),
          }));
        },

        addIncome(income: Omit<IncomeSource, 'id' | 'isEnabled'>) {
          updateActiveScenario((s) => ({
            ...s,
            incomes: [
              ...s.incomes,
              { ...income, id: crypto.randomUUID(), isEnabled: true },
            ],
          }));
        },
        editIncome(id: string, updated: Omit<IncomeSource, 'id'>) {
          updateActiveScenario((s) => ({
            ...s,
            incomes: s.incomes.map((i) =>
              i.id === id ? { ...updated, id } : i,
            ),
          }));
        },
        removeIncome(id: string) {
          updateActiveScenario((s) => ({
            ...s,
            incomes: s.incomes.filter((i) => i.id !== id),
          }));
        },

        addExpense(expense: Omit<Expense, 'id' | 'isEnabled'>) {
          updateActiveScenario((s) => ({
            ...s,
            expenses: [
              ...s.expenses,
              { ...expense, id: crypto.randomUUID(), isEnabled: true },
            ],
          }));
        },
        editExpense(id: string, updated: Omit<Expense, 'id'>) {
          updateActiveScenario((s) => ({
            ...s,
            expenses: s.expenses.map((e) =>
              e.id === id ? { ...updated, id } : e,
            ),
          }));
        },
        removeExpense(id: string) {
          updateActiveScenario((s) => ({
            ...s,
            expenses: s.expenses.filter((e) => e.id !== id),
          }));
        },

        addGoal(goal: Omit<Goal, 'id' | 'isEnabled'>) {
          updateActiveScenario((s) => ({
            ...s,
            goals: [
              ...s.goals,
              { ...goal, id: crypto.randomUUID(), isEnabled: true },
            ],
          }));
        },
        editGoal(id: string, updated: Omit<Goal, 'id'>) {
          updateActiveScenario((s) => ({
            ...s,
            goals: s.goals.map((g) => (g.id === id ? { ...updated, id } : g)),
          }));
        },
        async resetDemoData() {
          const activeDb = getFinancialDb();
          await activeDb.transaction(
            'rw',
            activeDb.scenarios,
            activeDb.transactions,
            activeDb.settings,
            async () => {
              await activeDb.scenarios.clear();
              await activeDb.transactions.clear();
              await activeDb.settings.clear();

              await activeDb.scenarios.bulkPut(initialState.scenarios);
              if (initialState.transactions.length > 0) {
                await activeDb.transactions.bulkPut(initialState.transactions);
              }
              await Promise.all([
                activeDb.settings.put({
                  key: 'accounts',
                  value: initialState.accounts,
                }),
                activeDb.settings.put({
                  key: 'categories',
                  value: initialState.categories,
                }),
                activeDb.settings.put({
                  key: 'budgets',
                  value: initialState.budgets,
                }),
                activeDb.settings.put({
                  key: 'activeScenarioId',
                  value: initialState.activeScenarioId,
                }),
              ]);
            },
          );
          patchState(store, initialState);
        },
        removeGoal(id: string) {
          updateActiveScenario((s) => ({
            ...s,
            goals: s.goals.filter((g) => g.id !== id),
          }));
        },
      };
    }),
  );
}
