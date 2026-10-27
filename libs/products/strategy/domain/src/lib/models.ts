export type TransactionType = 'income' | 'expense' | 'transfer';

export type Category = {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  type: 'income' | 'expense';
};

export type AccountType = 'bank' | 'cash' | 'savings' | 'other';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  fromAccountId?: string;
  date: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  goalId?: string;
  note: string;
};

export type IncomeSource = {
  id: string;
  name: string;
  amount: number;
  startMonth: number;
  endMonth: number | null;
  growthType: 'none' | 'percentage' | 'fixed';
  growthValue: number;
  isEnabled?: boolean;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  startMonth: number;
  monthsActive: number | null;
  recurrenceInterval?: number;
  isEnabled?: boolean;
};

export type Goal = {
  id: string;
  name: string;
  amount: number;
  category: string;
  priority: number;
  isEnabled?: boolean;
};

export type Loan = {
  id: string;
  name: string;
  principal: number;
  annualInterestRate: number;
  termMonths: number;
  startMonth: number;
  isEnabled?: boolean;
};

export type GoalMilestone = {
  id: string;
  name: string;
  amount: number;
  achievedMonth: number | null;
  rank: number;
  totalActiveGoals: number;
  fundAccumulated: number;
  status: 'achieved' | 'in_progress' | 'pending';
  priority: number;
  category: string;
};

export type FinancialLevel = {
  level: number;
  title: string;
  minNetWorth: number;
  maxNetWorth: number | null;
  progressPercentage: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

export type Scenario = {
  id: string;
  name: string;
  startDate: string;
  projectionYears: number;
  inflationRate: number;
  investmentYield: number;
  incomes: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
  loans: Loan[];
};

export interface ScenarioSummary {
  id: string;
  name: string;
  years: number;
  inflationRate: number;
  investmentYield: number;
  totalIncome: number;
  totalExpenses: number;
  totalGoals: number;
  monthlyAverage: number;
  finalReserve: number;
  incomes: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
  loans: Loan[];
  goalMilestones: GoalMilestone[];
  history: number[];
  realityTrajectory?: number[];
  dateLabels: string[];
  startDate?: string | Date;
}

export interface TogglableItem {
  id: string;
  name: string;
  isEnabled?: boolean;
}

export type Budget = {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  rollover: boolean;
};

export type FinancialState = {
  currentBalance: number;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  scenarios: Scenario[];
  activeScenarioId: string;
  budgets: Budget[];
};

export type ImportRow = {
  date: string;
  accountName: string;
  categoryName: string;
  amount: number;
  type: 'income' | 'expense';
  note: string;
};

export type ImportPayload = {
  accounts: { name: string }[];
  categories: {
    name: string;
    icon: string;
    type: 'income' | 'expense';
    parentName?: string;
  }[];
  transactions: ImportRow[];
};
