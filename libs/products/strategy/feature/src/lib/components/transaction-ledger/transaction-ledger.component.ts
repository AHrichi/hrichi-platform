import {
  Component,
  input,
  output,
  inject,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  min,
  required,
} from '@angular/forms/signals';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as XLSX from 'xlsx';
import {
  Account,
  Category,
  Goal,
  ImportPayload,
  Transaction,
} from '../../financial.store';
import { ThemeService } from '../../services/theme.service';

export const CATEGORY_ICONS = [
  '💰',
  '💻',
  '📈',
  '🏠',
  '🍽️',
  '🚗',
  '🎮',
  '🏥',
  '📚',
  '🛍️',
  '📄',
  '📦',
  '🎁',
  '🏧',
  '💵',
  '🏦',
  '✈️',
  '🎓',
  '👕',
  '📱',
  '💊',
  '🐾',
  '🎵',
  '📺',
  '⚽',
  '🎨',
  '🔧',
  '🌿',
  '💍',
  '🎂',
  '☕',
  '🍕',
  '🚌',
  '⛽',
  '🏋️',
  '📖',
  '🎬',
  '🎲',
  '💄',
  '🧸',
  '🔌',
  '💡',
  '🔑',
  '📌',
  '🎯',
  '⭐',
  '🌈',
  '🔥',
  '🍳',
  '🥗',
  '🍜',
  '🥩',
  '🧁',
  '🍷',
  '🧃',
  '🍺',
  '🚲',
  '🛴',
  '🛵',
  '🚘',
  '🚂',
  '🛩️',
  '⛵',
  '🚁',
  '🏡',
  '🏢',
  '🏪',
  '🏗️',
  '🌴',
  '🏖️',
  '🏔️',
  '🏕️',
  '🎟️',
  '🎭',
  '🎪',
  '🎤',
  '🎧',
  '🎸',
  '🎹',
  '🥁',
  '👔',
  '👗',
  '👟',
  '👒',
  '🧢',
  '⌚',
  '💎',
  '👜',
  '🐶',
  '🐱',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🦁',
  '🌻',
  '🌸',
  '🌺',
  '🍀',
  '🌵',
  '🎄',
  '🎃',
  '🎆',
  '⚡',
  '🌀',
  '☀️',
  '🌙',
  '❄️',
  '☁️',
  '🌊',
  '🔥',
  '🍼',
  '🚼',
  '♿',
  '🪑',
  '🛏️',
  '🚿',
  '🪥',
  '🧴',
  '📞',
  '📟',
  '📠',
  '🎥',
  '📷',
  '🖨️',
  '🖥️',
  '💾',
  '⚖️',
  '📊',
  '🗂️',
  '📋',
  '✂️',
  '🖊️',
  '📎',
  '📏',
  '🪴',
  '🧰',
  '🪜',
  '🔨',
  '🪛',
  '🔩',
  '🧲',
  '⚙️',
  '🥐',
  '🥖',
  '🧀',
  '🥚',
  '🥓',
  '🥦',
  '🥕',
  '🍇',
  '🦴',
  '🫀',
  '🫁',
  '🧠',
  '👁️',
  '🦷',
  '👂',
  '💪',
];

export const PIE_COLORS = [
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#84cc16',
  '#6366f1',
  '#d946ef',
];

interface CategoryTotal {
  id: string;
  icon: string;
  name: string;
  amount: number;
  pct: number;
  color: string;
  count: number;
  avg: number;
  min: number;
  max: number;
}

@Component({
  selector: 'app-transaction-ledger',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, BaseChartDirective],
  templateUrl: './transaction-ledger.component.html',
  styleUrl: './transaction-ledger.component.scss',
})
export class TransactionLedgerComponent {
  CATEGORY_ICONS = CATEGORY_ICONS;
  transactions = input.required<Transaction[]>();
  currentBalance = input.required<number>();
  accounts = input.required<Account[]>();
  categories = input.required<Category[]>();
  goals = input<Goal[]>([]);

  addTransaction = output<Omit<Transaction, 'id'>>();
  updateTransaction = output<{ id: string; data: Omit<Transaction, 'id'> }>();
  removeTransaction = output<string>();
  addAccount = output<{
    name: string;
    type: Account['type'];
    initialBalance: number;
  }>();
  removeAccount = output<string>();
  updateAccount = output<{ id: string; data: Partial<Omit<Account, 'id'>> }>();
  addCategory = output<Omit<Category, 'id'>>();
  removeCategory = output<string>();
  updateCategory = output<{
    id: string;
    data: Partial<Omit<Category, 'id'>>;
  }>();
  bulkImport = output<ImportPayload>();

  private themeService = inject(ThemeService);
  isDarkMode = this.themeService.isDarkMode;

  readonly ledgerModel = signal({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'expense' as 'income' | 'expense' | 'transfer',
    accountId: '',
    fromAccountId: '',
    categoryId: '',
    goalId: '',
    note: '',
  });

  readonly ledgerForm = form(
    this.ledgerModel,
    (schema) => {
      required(schema.date, { message: 'Date is required' });
      required(schema.amount, { message: 'Amount is required' });
      min(schema.amount, 0.1, { message: 'Amount must be at least 0.1' });
      required(schema.type);
      required(schema.accountId, { message: 'Account is required' });
      required(schema.note, { message: 'Note is required' });
    },
    {
      submission: {
        action: async () => this.onSubmit(),
      },
    },
  );

  readonly addAccountModel = signal({
    name: '',
    type: 'cash' as Account['type'],
    initialBalance: 0,
  });

  readonly addAccountForm = form(
    this.addAccountModel,
    (schema) => {
      required(schema.name, { message: 'Account name is required' });
      required(schema.type);
      required(schema.initialBalance);
    },
    {
      submission: {
        action: async () => this.onSubmitAddAccount(),
      },
    },
  );

  showAddAccount = false;
  isTransfer = signal(false);
  editingTransactionId = signal<string | null>(null);
  showCategoryDropdown = signal(false);
  showGoalDropdown = signal(false);

  selectedGoalLabel(): string {
    const gid = this.ledgerModel().goalId;
    if (!gid) return '— None —';
    const goal = this.goals().find((g) => g.id === gid);
    return goal ? goal.name : '— None —';
  }

  categoryManageTab = signal<'income' | 'expense'>('expense');
  editingCategory = signal<Category | null>(null);

  activeTab = signal<'ledger' | 'analytics' | 'accounts' | 'categories'>(
    'ledger',
  );

  // --- Search, Filter, Sort, Pagination ---

  searchQuery = signal('');
  filterType = signal<'all' | 'income' | 'expense' | 'transfer'>('all');
  filterAccountId = signal('');
  filterCategoryId = signal('');
  filterDateFrom = signal('');
  filterDateTo = signal('');
  sortBy = signal<'date' | 'amount'>('date');
  sortAsc = signal(false);
  currentPage = signal(1);
  pageSize = signal(25);

  readonly categoryModel = signal({
    name: '',
    icon: '📦',
    type: 'expense' as 'income' | 'expense',
    parentId: '',
  });

  readonly categoryForm = form(
    this.categoryModel,
    (schema) => {
      required(schema.name, { message: 'Category name is required' });
      required(schema.icon);
      required(schema.type);
    },
    {
      submission: {
        action: async () => this.saveCategory(),
      },
    },
  );

  // --- Analytics signals ---

  analyticsDateFrom = signal('');
  analyticsDateTo = signal('');
  analyticsTypeFilter = signal<'all' | 'income' | 'expense' | 'transfer'>(
    'all',
  );
  selectedCategoryId = signal<string | null>(null);

  analyticsFilteredTransactions = computed(() => {
    let result = this.transactions();
    const from = this.analyticsDateFrom();
    const to = this.analyticsDateTo();
    const typeFilter = this.analyticsTypeFilter();
    if (from) result = result.filter((t) => t.date >= from);
    if (to) result = result.filter((t) => t.date <= to);
    if (typeFilter !== 'all')
      result = result.filter((t) => t.type === typeFilter);
    return result;
  });

  // --- Computeds ---

  accountBalances = computed(() => {
    const accts = this.accounts();
    const txs = this.transactions();
    return accts.map((a) => {
      let net = 0;
      for (const t of txs) {
        if (t.type === 'income' && t.accountId === a.id) net += t.amount;
        else if (t.type === 'expense' && t.accountId === a.id) net -= t.amount;
        else if (t.type === 'transfer') {
          if (t.fromAccountId === a.id) net -= t.amount;
          if (t.accountId === a.id) net += t.amount;
        }
      }
      return { ...a, balance: a.initialBalance + net };
    });
  });

  accountsMap = computed(() => {
    const map: Record<string, { name: string; type: Account['type'] }> = {};
    for (const a of this.accounts()) map[a.id] = { name: a.name, type: a.type };
    return map;
  });

  categoriesTree = computed(() => {
    const all = this.categories();
    const parents = all.filter((c) => !c.parentId);
    return parents.map((p) => ({
      ...p,
      children: all.filter((c) => c.parentId === p.id),
    }));
  });

  categoriesMap = computed(() => {
    const map: Record<string, Category> = {};
    for (const c of this.categories()) map[c.id] = c;
    return map;
  });

  selectedCategoryLabel(): string {
    const id = this.ledgerModel().categoryId;
    if (!id) return '— Uncategorized —';
    const cat = this.categoriesMap()[id];
    return cat ? this.categoryLabel(cat) : '— Uncategorized —';
  }

  filteredCategoryTree = computed(() => {
    const tab = this.categoryManageTab();
    return this.categoriesTree().filter((p) => p.type === tab);
  });

  availableParents = computed(() => {
    const tab = this.categoryManageTab();
    return this.categories().filter((c) => !c.parentId && c.type === tab);
  });

  isEditing = computed(() => this.editingTransactionId() !== null);

  filteredTransactions = computed(() => {
    let result = this.transactions();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      result = result.filter((t) => t.note.toLowerCase().includes(query));
    }

    const typeFilter = this.filterType();
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    const acctId = this.filterAccountId();
    if (acctId) {
      result = result.filter(
        (t) => t.accountId === acctId || t.fromAccountId === acctId,
      );
    }

    const catId = this.filterCategoryId();
    if (catId) {
      result = result.filter((t) => t.categoryId === catId);
    }

    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();
    if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
    if (dateTo) result = result.filter((t) => t.date <= dateTo);

    const sortField = this.sortBy();
    const asc = this.sortAsc();
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      return asc ? cmp : -cmp;
    });

    return result;
  });

  pagedTransactions = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    return this.filteredTransactions().slice((page - 1) * size, page * size);
  });

  totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.filteredTransactions().length / this.pageSize()),
    ),
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  totalFilteredCount = computed(() => this.filteredTransactions().length);
  totalUnfilteredCount = computed(() => this.transactions().length);

  // --- Analytics computeds ---

  analyticsSummary = computed(() => {
    const txs = this.analyticsFilteredTransactions();
    let income = 0,
      expense = 0,
      transfer = 0;
    for (const t of txs) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'transfer') transfer += t.amount;
    }
    return {
      income,
      expense,
      transfer,
      net: income - expense,
      count: txs.length,
    };
  });

  analyticsByCategory = computed(() => {
    const txs = this.analyticsFilteredTransactions();
    const cats = this.categoriesMap();
    const incMap = new Map<
      string,
      { amount: number; count: number; min: number; max: number }
    >();
    const expMap = new Map<
      string,
      { amount: number; count: number; min: number; max: number }
    >();
    const trfMap = new Map<
      string,
      { amount: number; count: number; min: number; max: number }
    >();
    let incTotal = 0,
      expTotal = 0,
      trfTotal = 0;

    const accumulate = (
      map: Map<
        string,
        { amount: number; count: number; min: number; max: number }
      >,
      key: string,
      amount: number,
    ) => {
      const existing = map.get(key);
      if (existing) {
        existing.amount += amount;
        existing.count++;
        existing.min = Math.min(existing.min, amount);
        existing.max = Math.max(existing.max, amount);
      } else {
        map.set(key, { amount, count: 1, min: amount, max: amount });
      }
    };

    for (const t of txs) {
      const rawKey = t.categoryId || '__uncat__';
      const cat = rawKey !== '__uncat__' ? cats[rawKey] : undefined;
      const groupKey = cat?.parentId || rawKey;
      if (t.type === 'income') {
        accumulate(incMap, groupKey, t.amount);
        incTotal += t.amount;
      } else if (t.type === 'expense') {
        accumulate(expMap, groupKey, t.amount);
        expTotal += t.amount;
      } else if (t.type === 'transfer') {
        accumulate(trfMap, groupKey, t.amount);
        trfTotal += t.amount;
      }
    }

    const toList = (
      map: Map<
        string,
        { amount: number; count: number; min: number; max: number }
      >,
      total: number,
    ): CategoryTotal[] => {
      const list: CategoryTotal[] = [];
      let idx = 0;
      for (const [id, stats] of map) {
        const cat = id === '__uncat__' ? undefined : cats[id];
        list.push({
          id,
          icon: cat?.icon || '📄',
          name: cat ? cat.name : 'Uncategorized',
          amount: stats.amount,
          pct: total > 0 ? (stats.amount / total) * 100 : 0,
          color: PIE_COLORS[idx % PIE_COLORS.length],
          count: stats.count,
          avg: stats.amount / stats.count,
          min: stats.min,
          max: stats.max,
        });
        idx++;
      }
      list.sort((a, b) => b.amount - a.amount);
      return list;
    };

    const income = toList(incMap, incTotal);
    const expense = toList(expMap, expTotal);
    const transfer = toList(trfMap, trfTotal);
    const all = [...income, ...expense];
    return { income, expense, transfer, all };
  });

  private toPieData(items: CategoryTotal[]): ChartConfiguration<'pie'>['data'] {
    const isDark = this.isDarkMode();
    return {
      labels: items.map((i) => `${i.icon} ${i.name}`),
      datasets: [
        {
          data: items.map((i) => i.amount),
          backgroundColor: items.map((i) => i.color),
          borderWidth: 2,
          borderColor: isDark ? '#1e293b' : '#ffffff',
        },
      ],
    };
  }

  pieChartExpenseData = computed(() =>
    this.toPieData(this.analyticsByCategory().expense),
  );
  pieChartIncomeData = computed(() =>
    this.toPieData(this.analyticsByCategory().income),
  );
  pieChartTransferData = computed(() =>
    this.toPieData(this.analyticsByCategory().transfer),
  );
  pieChartAllData = computed(() =>
    this.toPieData(this.analyticsByCategory().all),
  );

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            return ` ${new Intl.NumberFormat('en-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(value)}`;
          },
        },
      },
    },
  };

  analyticsMonthly = computed(() => {
    const txs = this.analyticsFilteredTransactions();
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const month = t.date ? t.date.substring(0, 7) : 'unknown';
      let row = map.get(month);
      if (!row) {
        row = { income: 0, expense: 0 };
        map.set(month, row);
      }
      if (t.type === 'income') row.income += t.amount;
      else if (t.type === 'expense') row.expense += t.amount;
    }
    const months = Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return { months };
  });

  analyticsMonthlyChartData = computed<ChartConfiguration<'bar'>['data']>(
    () => {
      const { months } = this.analyticsMonthly();
      const isDark = this.isDarkMode();
      return {
        labels: months.map(([m]) => this.formatMonth(m)),
        datasets: [
          {
            label: 'Income',
            data: months.map(([, r]) => r.income),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Expense',
            data: months.map(([, r]) => r.expense),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      };
    },
  );

  analyticsMonthlyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { boxWidth: 12, padding: 8 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = (context.parsed as { y: number }).y;
            return ` ${context.dataset.label}: ${new Intl.NumberFormat('en-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(val)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: true }, ticks: { maxTicksLimit: 6 } },
    },
  };

  constructor() {
    effect(() => {
      const accts = this.accounts();
      if (accts.length > 0 && !this.ledgerModel().accountId) {
        this.ledgerModel.update((m) => ({ ...m, accountId: accts[0].id }));
      }
    });

    effect(() => {
      const type = this.ledgerModel().type;
      this.isTransfer.set(type === 'transfer');
      if (type !== 'transfer') {
        this.ledgerModel.update((m) => ({ ...m, fromAccountId: '' }));
      }
    });

    effect(() => {
      const tab = this.categoryManageTab();
      this.categoryModel.update((m) => ({ ...m, type: tab }));
    });
  }

  // --- Transaction methods ---

  onTypeChange() {
    const type = this.ledgerModel().type;
    this.isTransfer.set(type === 'transfer');
  }

  startEditTransaction(tx: Transaction) {
    this.editingTransactionId.set(tx.id);
    this.ledgerModel.set({
      date: tx.date,
      amount: tx.amount,
      type: tx.type === 'transfer' ? 'transfer' : tx.type,
      accountId: tx.type === 'transfer' ? tx.accountId : tx.accountId,
      fromAccountId: tx.fromAccountId || '',
      categoryId: tx.categoryId || '',
      goalId: tx.goalId || '',
      note: tx.note,
    });
  }

  cancelEdit() {
    this.editingTransactionId.set(null);
    this.ledgerModel.set({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      type: 'expense',
      accountId: this.accounts().length > 0 ? this.accounts()[0].id : '',
      fromAccountId: '',
      categoryId: '',
      goalId: '',
      note: '',
    });
  }

  async onSubmit(): Promise<undefined> {
    const raw = this.ledgerModel();
    const tx: Omit<Transaction, 'id'> = {
      date: raw.date,
      amount: raw.amount,
      type: raw.type,
      accountId:
        raw.type === 'transfer'
          ? raw.fromAccountId || raw.accountId
          : raw.accountId,
      note: raw.note,
    };
    if (raw.type === 'transfer') {
      tx.fromAccountId = raw.fromAccountId || raw.accountId;
      tx.accountId = raw.accountId;
    }
    if (raw.categoryId) tx.categoryId = raw.categoryId;
    if (raw.goalId) tx.goalId = raw.goalId;

    const editingId = this.editingTransactionId();
    if (editingId) {
      this.updateTransaction.emit({ id: editingId, data: tx });
      this.cancelEdit();
    } else {
      this.addTransaction.emit(tx);
      this.ledgerModel.update((m) => ({
        ...m,
        amount: 0,
        note: '',
        goalId: '',
      }));
    }
    return undefined;
  }

  selectCategory(id: string) {
    this.ledgerModel.update((m) => ({
      ...m,
      categoryId: id === '' ? '' : id,
    }));
    this.showCategoryDropdown.set(false);
  }

  toggleCategoryDropdown() {
    this.showCategoryDropdown.update((v) => !v);
  }

  closeCategoryDropdown() {
    this.showCategoryDropdown.set(false);
  }

  selectGoal(id: string) {
    this.ledgerModel.update((m) => ({
      ...m,
      goalId: id === '' ? '' : id,
    }));
    this.showGoalDropdown.set(false);
  }

  toggleGoalDropdown() {
    this.showGoalDropdown.update((v) => !v);
  }

  closeGoalDropdown() {
    this.showGoalDropdown.set(false);
  }

  // --- Account methods ---

  async onSubmitAddAccount(): Promise<undefined> {
    this.addAccount.emit(this.addAccountModel());
    this.addAccountModel.set({ name: '', type: 'cash', initialBalance: 0 });
    this.showAddAccount = false;
    return undefined;
  }

  removeAccountById(id: string) {
    if (
      confirm(
        'Remove this account? Existing transactions will be reassigned to the first account.',
      )
    ) {
      this.removeAccount.emit(id);
    }
  }

  // --- Category Manager methods ---

  openCategoryManager() {
    this.activeTab.set('categories');
    this.editingCategory.set(null);
    this.categoryModel.set({
      name: '',
      icon: '📦',
      type: this.categoryManageTab(),
      parentId: '',
    });
  }

  closeCategoryManager() {
    this.activeTab.set('ledger');
    this.editingCategory.set(null);
  }

  setCategoryTab(tab: 'income' | 'expense') {
    this.categoryManageTab.set(tab);
    this.editingCategory.set(null);
    this.categoryModel.set({ name: '', icon: '📦', type: tab, parentId: '' });
  }

  startAddCategory() {
    this.editingCategory.set(null);
    this.categoryModel.set({
      name: '',
      icon: '📦',
      type: this.categoryManageTab(),
      parentId: '',
    });
  }

  startEditCategory(cat: Category) {
    this.editingCategory.set(cat);
    this.categoryModel.set({
      name: cat.name,
      icon: cat.icon,
      type: cat.type,
      parentId: cat.parentId || '',
    });
  }

  async saveCategory(): Promise<undefined> {
    const raw = this.categoryModel();
    const data: Omit<Category, 'id'> = {
      name: raw.name,
      icon: raw.icon,
      type: raw.type,
      parentId: raw.parentId || null,
    };
    const editing = this.editingCategory();
    if (editing) {
      this.updateCategory.emit({ id: editing.id, data });
    } else {
      this.addCategory.emit(data);
    }
    this.editingCategory.set(null);
    this.categoryModel.set({
      name: '',
      icon: '📦',
      type: this.categoryManageTab(),
      parentId: '',
    });
    return undefined;
  }

  confirmRemoveCategory(id: string) {
    const cat = this.categoriesMap()[id];
    if (!cat) return;
    const hasChildren = this.categories().some((c) => c.parentId === id);
    const msg = hasChildren
      ? `Delete "${cat.name}" and ALL its subcategories?`
      : `Delete category "${cat.name}"?`;
    if (confirm(msg)) this.removeCategory.emit(id);
  }

  selectIcon(icon: string) {
    this.categoryModel.update((m) => ({ ...m, icon }));
  }

  trackByFn(_: number, item: { id: string | number }) {
    return item.id;
  }

  // --- Filter / Search / Pagination methods ---

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  setFilter(key: string, value: string) {
    switch (key) {
      case 'type':
        this.filterType.set(value as 'all' | 'income' | 'expense' | 'transfer');
        break;
      case 'account':
        this.filterAccountId.set(value);
        break;
      case 'category':
        this.filterCategoryId.set(value);
        break;
      case 'dateFrom':
        this.filterDateFrom.set(value);
        break;
      case 'dateTo':
        this.filterDateTo.set(value);
        break;
    }
    this.currentPage.set(1);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.filterType.set('all');
    this.filterAccountId.set('');
    this.filterCategoryId.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.sortBy.set('date');
    this.sortAsc.set(false);
    this.currentPage.set(1);
  }

  hasActiveFilters(): boolean {
    return (
      this.searchQuery() !== '' ||
      this.filterType() !== 'all' ||
      this.filterAccountId() !== '' ||
      this.filterCategoryId() !== '' ||
      this.filterDateFrom() !== '' ||
      this.filterDateTo() !== ''
    );
  }

  toggleSort(field: 'date' | 'amount') {
    if (this.sortBy() === field) {
      this.sortAsc.update((v) => !v);
    } else {
      this.sortBy.set(field);
      this.sortAsc.set(field === 'date');
    }
    this.currentPage.set(1);
  }

  prevPage() {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  // --- Analytics methods ---

  clearAnalyticsFilters() {
    this.analyticsDateFrom.set('');
    this.analyticsDateTo.set('');
    this.analyticsTypeFilter.set('all');
    this.selectedCategoryId.set(null);
  }

  selectCategoryForBreakdown(id: string | null) {
    this.selectedCategoryId.set(this.selectedCategoryId() === id ? null : id);
  }

  categoryBreakdownTransactions = computed(() => {
    const catId = this.selectedCategoryId();
    if (!catId) return [];
    const cats = this.categories();
    const childIds = new Set<string>();
    childIds.add(catId);
    for (const c of cats) {
      if (c.parentId === catId) childIds.add(c.id);
    }
    return this.analyticsFilteredTransactions()
      .filter((t) => t.categoryId && childIds.has(t.categoryId))
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  categoryBreakdownTotal = computed(() => {
    const txs = this.categoryBreakdownTransactions();
    return txs.reduce((s, t) => s + t.amount, 0);
  });

  // --- XLSX Import ---

  showImportDialog = signal(false);
  importPreviewData = signal<ImportPayload | null>(null);
  importFileName = signal('');
  importAccountsFound = signal(0);
  importCategoriesFound = signal(0);

  onXlsxImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.parseXlsx(file);
    input.value = '';
  }

  private parseXlsx(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: '',
        });

        if (!rows.length) {
          alert('No data found in the file.');
          return;
        }

        // Detect columns by header name
        const headers = Object.keys(rows[0]);
        const colDate = headers.find((h) => /date/i.test(h));
        const colAccount = headers.find(
          (h) => /compte/i.test(h) || /account/i.test(h),
        );
        const colCategory = headers.find((h) =>
          /catégorie|catégorie|categorie|category/i.test(h),
        );
        const colSubcategory = headers.find(
          (h) => /sous.?cat/i.test(h) || /sub.?cat/i.test(h),
        );
        const colNote = headers.find((h) => /note|desc|description/i.test(h));
        const colAmount = headers.find((h) => /montant|tnd|amount/i.test(h));
        const colType = headers.find((h) =>
          /revenu|dépense|revenue|expense|type/i.test(h),
        );
        const colCompte = headers.find((h) => h === 'Compte'); // duplicate account column

        if (!colDate || !colAmount || !colType) {
          alert(
            'Could not detect required columns (Date, Amount, Type/Revenu-dépense). Check headers.',
          );
          return;
        }

        const parseDate = (v: string): string => {
          // Handle DD/MM/YYYY HH:mm:ss or DD/MM/YYYY
          const m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (m)
            return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
          // Fallback
          const d = new Date(v);
          return isNaN(d.getTime()) ? v : d.toISOString().split('T')[0];
        };

        const typeValue = (v: string): 'income' | 'expense' => {
          const lower = v.trim().toLowerCase();
          if (
            lower === 'revenu' ||
            lower === 'income' ||
            lower.startsWith('reven')
          )
            return 'income';
          return 'expense';
        };

        const parseAmount = (v: string): number => {
          const cleaned = v.replace(/[^0-9.,-]/g, '').replace(',', '.');
          return parseFloat(cleaned) || 0;
        };

        const accountNames = new Set<string>();
        const categoryNames = new Set<string>();
        const transactions: ImportPayload['transactions'] = [];

        for (const row of rows) {
          const dateVal = row[colDate!]?.toString() || '';
          const accountVal = colAccount
            ? (row[colAccount]?.toString() || 'Cash').trim()
            : 'Cash';
          const catVal = colCategory
            ? (row[colCategory]?.toString() || 'Uncategorized').trim()
            : 'Uncategorized';
          const subcatVal = colSubcategory
            ? (row[colSubcategory]?.toString() || '').trim()
            : '';
          const noteVal = colNote
            ? (row[colNote]?.toString() || '').trim()
            : '';
          const amountVal = colAmount ? row[colAmount]?.toString() || '' : '';
          const typeVal = colType ? row[colType]?.toString() || '' : '';

          if (!dateVal || !amountVal) continue;

          const date = parseDate(dateVal);
          const amount = parseAmount(amountVal);
          if (amount === 0) continue;

          const type = typeValue(typeVal);
          let note = noteVal;
          if (!note && row[colNote === colNote ? '' : ''] === undefined) {
            // try to use any other text column as note
          }
          if (!note) note = catVal;

          accountNames.add(accountVal);
          categoryNames.add(subcatVal || catVal);
          transactions.push({
            date,
            accountName: accountVal,
            categoryName: subcatVal || catVal,
            amount,
            type,
            note,
          });
        }

        const categories: ImportPayload['categories'] = [];
        const seenCats = new Set<string>();
        for (const row of rows) {
          const catVal = colCategory
            ? (row[colCategory]?.toString() || '').trim()
            : '';
          const subcatVal = colSubcategory
            ? (row[colSubcategory]?.toString() || '').trim()
            : '';
          if (catVal && !seenCats.has(catVal)) {
            seenCats.add(catVal);
            categories.push({ name: catVal, icon: '📦', type: 'expense' });
          }
          if (subcatVal && !seenCats.has(subcatVal) && catVal) {
            seenCats.add(subcatVal);
            categories.push({
              name: subcatVal,
              icon: '📂',
              type: 'expense',
              parentName: catVal,
            });
          }
        }

        const accounts: ImportPayload['accounts'] = [];
        for (const name of accountNames) {
          accounts.push({ name });
        }

        this.importFileName.set(file.name);
        this.importAccountsFound.set(accounts.length);
        this.importCategoriesFound.set(categories.length);
        this.importPreviewData.set({ accounts, categories, transactions });
        this.showImportDialog.set(true);
      } catch (err) {
        console.error('XLSX parse error:', err);
        alert(
          'Failed to parse the Excel file. Make sure it is a valid .xlsx file.',
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }

  confirmImport() {
    const payload = this.importPreviewData();
    if (!payload) return;
    this.bulkImport.emit(payload);
    this.showImportDialog.set(false);
    this.importPreviewData.set(null);
  }

  cancelImport() {
    this.showImportDialog.set(false);
    this.importPreviewData.set(null);
  }

  // --- Helpers ---

  accountTypeIcon(type: Account['type']): string {
    switch (type) {
      case 'bank':
        return '🏦';
      case 'cash':
        return '💵';
      case 'savings':
        return '🏧';
      case 'other':
        return '📦';
    }
  }

  categoryLabel(cat: Category | undefined): string {
    if (!cat) return 'Uncategorized';
    if (cat.parentId) {
      const parent = this.categoriesMap()[cat.parentId];
      return `${parent ? parent.icon + ' ' : ''}${cat.name}`;
    }
    return `${cat.icon} ${cat.name}`;
  }

  formatMonth(m: string): string {
    const [y, mo] = m.split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[parseInt(mo) - 1] || mo} ${y}`;
  }
}
