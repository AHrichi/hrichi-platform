import { Category, FinancialState, Scenario } from './models';

export const defaultScenarioId = '';
export const today = new Date();
export const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

export const defaultAccountId = 'acc-primary-cash';

export function defaultCategories(): Category[] {
  return [];
}

export const initialScenarios: Scenario[] = [];

export const initialState: FinancialState = {
  currentBalance: 0,
  accounts: [
    { id: defaultAccountId, name: 'Cash', type: 'cash', initialBalance: 0 },
  ],
  categories: [],
  transactions: [],
  budgets: [],
  scenarios: [],
  activeScenarioId: '',
};
