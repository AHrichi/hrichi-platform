import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import {
  FinancialState,
  GoalMilestone,
  Goal,
  Scenario,
  FinancialLevel,
  Achievement,
  Account,
  Category,
  Transaction,
} from './models';
import {
  ScenarioProjection,
  computeScenarioProjection,
  calculateMonthlyPayment,
} from '../utils/projection-engine';

const chartColors = ['#166534', '#2563eb', '#ca8a04', '#dc2626', '#9333ea'];

export function withFinancialComputeds() {
  return signalStoreFeature(
    { state: type<FinancialState>() },
    withComputed(
      ({
        scenarios,
        activeScenarioId,
        currentBalance,
        transactions,
        budgets,
        categories,
        accounts,
      }) => {
        const activeScenario = computed(
          () =>
            scenarios().find((s) => s.id === activeScenarioId()) ||
            scenarios()[0],
        );

        const chartDatasets = computed(() => {
          return scenarios().map((scenario, index) => {
            const startDateObj = new Date(scenario.startDate || new Date());
            const proj = computeScenarioProjection(
              scenario,
              currentBalance(),
              startDateObj,
            );
            return {
              data: proj.history,
              label: scenario.name,
              fill: false,
              tension: 0.4,
              borderColor: chartColors[index % chartColors.length],
              backgroundColor: chartColors[index % chartColors.length],
              pointRadius: 0,
              pointHitRadius: 10,
            };
          });
        });

        const scenarioSummaries = computed(() => {
          return scenarios().map((scenario) => {
            const startDateObj = new Date(scenario.startDate || new Date());
            const proj = computeScenarioProjection(
              scenario,
              currentBalance(),
              startDateObj,
            );
            return {
              id: scenario.id,
              name: scenario.name,
              years: scenario.projectionYears,
              inflationRate: scenario.inflationRate,
              investmentYield: scenario.investmentYield,
              totalIncome: proj.totalIncome,
              totalExpenses: proj.totalExpenses,
              totalGoals: proj.totalGoals,
              monthlyAverage:
                (proj.totalIncome - proj.totalExpenses) /
                (scenario.projectionYears * 12),
              finalReserve: proj.history[proj.history.length - 1],
              incomes: scenario.incomes,
              expenses: scenario.expenses,
              goals: scenario.goals,
              loans: scenario.loans || [],
              goalMilestones: proj.goalMilestones,
              history: proj.history,
              dateLabels: proj.dateLabels,
              startDate: scenario.startDate,
            };
          });
        });

        const currentMonthPerformance = computed(() => {
          const activePlan = activeScenario();
          const allTransactions = transactions();
          const now = new Date();

          const currentMonthActuals = allTransactions.filter((t) => {
            const tDate = new Date(t.date);
            return (
              tDate.getMonth() === now.getMonth() &&
              tDate.getFullYear() === now.getFullYear()
            );
          });

          const actualIncome = currentMonthActuals
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          const actualExpense = currentMonthActuals
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          if (!activePlan) {
            return {
              actualIncome,
              actualExpense,
              plannedIncome: 0,
              plannedExpense: 0,
              incomeVariance: actualIncome,
              expenseVariance: -actualExpense,
              netSavings: actualIncome - actualExpense,
              savingsRate:
                actualIncome > 0
                  ? ((actualIncome - actualExpense) / actualIncome) * 100
                  : 0,
            };
          }

          const scenarioStart = activePlan.startDate
            ? new Date(activePlan.startDate)
            : new Date();
          const currentMonthIndex =
            (now.getFullYear() - scenarioStart.getFullYear()) * 12 +
            (now.getMonth() - scenarioStart.getMonth()) +
            1;

          let plannedIncome = 0;
          for (const inc of activePlan.incomes) {
            if (
              inc.isEnabled !== false &&
              currentMonthIndex >= inc.startMonth &&
              (!inc.endMonth || currentMonthIndex <= inc.endMonth)
            ) {
              let amount = inc.amount;
              const yPassed = Math.floor(
                (currentMonthIndex - inc.startMonth) / 12,
              );
              if (inc.growthType === 'fixed')
                amount += yPassed * inc.growthValue;
              else if (inc.growthType === 'percentage')
                amount *= Math.pow(1 + inc.growthValue / 100, yPassed);
              plannedIncome += amount;
            }
          }

          let plannedExpense = 0;
          for (const exp of activePlan.expenses) {
            const expStart = exp.startMonth || 1;
            const interval = exp.recurrenceInterval || 1;
            if (
              exp.isEnabled !== false &&
              currentMonthIndex >= expStart &&
              (!exp.monthsActive ||
                currentMonthIndex < expStart + exp.monthsActive)
            ) {
              if ((currentMonthIndex - expStart) % interval === 0) {
                plannedExpense += exp.amount;
              }
            }
          }

          for (const loan of activePlan.loans || []) {
            if (loan.isEnabled !== false && loan.startMonth === 1) {
              plannedExpense += calculateMonthlyPayment(
                loan.principal,
                loan.annualInterestRate,
                loan.termMonths,
              );
            }
          }

          let goalCashFlow = plannedIncome - plannedExpense;
          const activeGoals = (activePlan.goals || [])
            .filter((g) => g.isEnabled !== false)
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));
          for (const g of activeGoals) {
            if (goalCashFlow > 0) {
              const contrib = Math.min(g.amount, goalCashFlow);
              plannedExpense += contrib;
              goalCashFlow -= contrib;
            }
            if (goalCashFlow <= 0) break;
          }

          return {
            actualIncome,
            actualExpense,
            plannedIncome,
            plannedExpense,
            incomeVariance: actualIncome - plannedIncome,
            expenseVariance: plannedExpense - actualExpense,
            actualNet: actualIncome - actualExpense,
            plannedNet: plannedIncome - plannedExpense,
          };
        });

        const activeGoalMilestones = computed(() => {
          const activeId = activeScenarioId();
          const summary = scenarioSummaries().find((s) => s.id === activeId);
          return summary ? summary.goalMilestones : [];
        });

        const currentProjectionMonth = computed(() => {
          const scenario = activeScenario();
          if (!scenario || !scenario.startDate) return 0;
          const start = new Date(scenario.startDate);
          const today = new Date();
          const months =
            (today.getFullYear() - start.getFullYear()) * 12 +
            (today.getMonth() - start.getMonth());
          return Math.max(0, Math.min(months, scenario.projectionYears * 12));
        });

        const currentGoalProgress = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return [];

          const totalMonths = scenario.projectionYears * 12;
          const currentMonth = currentProjectionMonth();
          const activeGoals = (scenario.goals || []).filter(
            (g: Goal) => g.isEnabled !== false,
          );

          const goalFunds: number[] = new Array(activeGoals.length).fill(0);
          const goalAchieved: boolean[] = new Array(activeGoals.length).fill(
            false,
          );
          const goalAchievedMonth: (number | null)[] = new Array(
            activeGoals.length,
          ).fill(null);
          let lastCashFlow = 0;

          for (let month = 1; month <= currentMonth; month++) {
            let cashFlow = 0;
            for (const inc of scenario.incomes) {
              if (inc.isEnabled === false) continue;
              if (
                month >= inc.startMonth &&
                (!inc.endMonth || month <= inc.endMonth)
              ) {
                let amount = inc.amount;
                const yPassed = Math.floor((month - inc.startMonth) / 12);
                if (inc.growthType === 'fixed')
                  amount += yPassed * inc.growthValue;
                else if (inc.growthType === 'percentage')
                  amount *= Math.pow(1 + inc.growthValue / 100, yPassed);
                cashFlow += amount;
              }
            }
            for (const exp of scenario.expenses) {
              if (exp.isEnabled === false) continue;
              const start = exp.startMonth || 1;
              if (
                month >= start &&
                (!exp.monthsActive || month < start + exp.monthsActive)
              ) {
                if ((month - start) % (exp.recurrenceInterval || 1) === 0) {
                  cashFlow -= exp.amount;
                }
              }
            }
            for (const loan of scenario.loans || []) {
              if (loan.isEnabled === false) continue;
              if (
                month >= loan.startMonth &&
                month <= loan.startMonth + loan.termMonths - 1
              ) {
                cashFlow -= calculateMonthlyPayment(
                  loan.principal,
                  loan.annualInterestRate,
                  loan.termMonths,
                );
              }
            }

            for (let gi = 0; gi < activeGoals.length; gi++) {
              if (goalAchieved[gi]) continue;
              const g = activeGoals[gi];
              if (cashFlow > 0) {
                const remainingNeeded = g.amount - goalFunds[gi];
                const contrib = Math.min(remainingNeeded, cashFlow);
                goalFunds[gi] += contrib;
                cashFlow -= contrib;
                if (goalFunds[gi] >= g.amount) {
                  goalAchievedMonth[gi] = month;
                  goalAchieved[gi] = true;
                }
              }
              if (cashFlow <= 0) break;
            }

            let remaining = cashFlow;
            for (let gi = 0; gi < activeGoals.length; gi++) {
              if (goalAchieved[gi]) continue;
              const g = activeGoals[gi];
              const remainingNeeded = g.amount - goalFunds[gi];
              if (remaining >= remainingNeeded) {
                goalAchievedMonth[gi] = month;
                goalAchieved[gi] = true;
                remaining -= remainingNeeded;
                goalFunds[gi] = g.amount;
              } else {
                break;
              }
            }
            lastCashFlow = cashFlow;
          }

          return activeGoals.map((g, i) => {
            let status: GoalMilestone['status'];

            if (goalAchieved[i]) {
              status = 'achieved';
            } else {
              let isReceivingCashFlow = false;
              for (let j = 0; j <= i; j++) {
                if (!goalAchieved[j]) {
                  if (j === i) isReceivingCashFlow = true;
                  break;
                }
              }
              status = isReceivingCashFlow ? 'in_progress' : 'pending';
            }

            return {
              id: g.id,
              name: g.name,
              amount: g.amount,
              achievedMonth: goalAchievedMonth[i],
              rank: i + 1,
              totalActiveGoals: activeGoals.length,
              fundAccumulated: Math.min(goalFunds[i], g.amount),
              status,
              priority: g.priority || 0,
              category: g.category || '',
            };
          });
        });

        const projectedBalance = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return currentBalance();
          const start = new Date(scenario.startDate);
          const now = new Date();
          const monthsElapsed = Math.max(
            0,
            (now.getFullYear() - start.getFullYear()) * 12 +
              (now.getMonth() - start.getMonth()),
          );
          const proj = computeScenarioProjection(
            scenario,
            currentBalance(),
            start,
          );
          if (monthsElapsed === 0) return currentBalance();
          const idx = Math.min(monthsElapsed, proj.history.length - 1);
          return proj.history[idx];
        });

        const realityGoalProgress = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return [];
          const allTxns = transactions();
          const allScenarios = scenarios();
          const startDate = new Date(scenario.startDate);
          const today = new Date();

          const activeGoals = (scenario.goals || []).filter(
            (g: Goal) => g.isEnabled !== false,
          );

          // Build a map: goal name → all goal IDs with that name across all scenarios
          const goalNameToIds = new Map<string, Set<string>>();
          for (const s of allScenarios) {
            for (const g of s.goals || []) {
              if (!goalNameToIds.has(g.name)) {
                goalNameToIds.set(g.name, new Set());
              }
              goalNameToIds.get(g.name)!.add(g.id);
            }
          }

          // Collect all goal IDs that share a name with any active goal
          const matchingIds = new Set<string>();
          for (const g of activeGoals) {
            const ids = goalNameToIds.get(g.name);
            if (ids) {
              for (const id of ids) matchingIds.add(id);
            }
          }

          const goalFunds: number[] = new Array(activeGoals.length).fill(0);
          const goalAchieved: boolean[] = new Array(activeGoals.length).fill(
            false,
          );
          const goalAchievedMonth: (number | null)[] = new Array(
            activeGoals.length,
          ).fill(null);
          const goalMonths: Set<number>[] = activeGoals.map(
            () => new Set<number>(),
          );

          const goalLinked = allTxns.filter(
            (t) => t.goalId && matchingIds.has(t.goalId),
          );
          for (const t of goalLinked) {
            const tDate = new Date(t.date);
            if (tDate < startDate || tDate > today) continue;
            // Find the active goal that shares a name with the transaction's linked goal
            const txnGoalName = allScenarios
              .flatMap((s) => s.goals || [])
              .find((g) => g.id === t.goalId)?.name;
            if (!txnGoalName) continue;
            const idx = activeGoals.findIndex((g) => g.name === txnGoalName);
            if (idx === -1) continue;
            const monthKey =
              (tDate.getFullYear() - startDate.getFullYear()) * 12 +
              (tDate.getMonth() - startDate.getMonth());
            goalMonths[idx].add(monthKey);

            if (t.type === 'income' || t.type === 'expense') {
              goalFunds[idx] += t.amount;
            }

            if (
              goalFunds[idx] >= activeGoals[idx].amount &&
              !goalAchieved[idx]
            ) {
              goalAchievedMonth[idx] = monthKey + 1;
              goalAchieved[idx] = true;
            }
          }

          const totalMonths = scenario.projectionYears * 12;
          const monthIdx =
            Math.max(0, ...goalMonths.map((s) => Math.max(0, ...s))) + 1;
          return activeGoals.map((g, i) => {
            let status: GoalMilestone['status'];
            if (goalAchieved[i]) {
              status = 'achieved';
            } else {
              let isReceivingCashFlow = false;
              for (let j = 0; j <= i; j++) {
                if (!goalAchieved[j]) {
                  if (j === i) isReceivingCashFlow = true;
                  break;
                }
              }
              status = isReceivingCashFlow ? 'in_progress' : 'pending';
            }
            return {
              id: g.id,
              name: g.name,
              amount: g.amount,
              achievedMonth: goalAchievedMonth[i],
              rank: i + 1,
              totalActiveGoals: activeGoals.length,
              fundAccumulated: Math.min(goalFunds[i], g.amount),
              status,
              priority: g.priority || 0,
              category: g.category || '',
            };
          });
        });

        const realityMonthlyCashFlow = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return { incomes: [], expenses: [], labels: [] };
          const allTxns = transactions();
          const startDate = new Date(scenario.startDate);
          const today = new Date();

          const monthlyMap = new Map<
            string,
            { income: number; expense: number }
          >();
          for (const t of allTxns) {
            const tDate = new Date(t.date);
            if (tDate < startDate || tDate > today) continue;
            const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
            const bucket = monthlyMap.get(key) || { income: 0, expense: 0 };
            if (t.type === 'income') bucket.income += t.amount;
            else if (t.type === 'expense') bucket.expense += t.amount;
            monthlyMap.set(key, bucket);
          }
          const sortedKeys = Array.from(monthlyMap.keys()).sort();
          const incomes: number[] = [];
          const expenses: number[] = [];
          const labels: string[] = [];
          for (const key of sortedKeys) {
            const b = monthlyMap.get(key)!;
            incomes.push(b.income);
            expenses.push(b.expense);
            labels.push(key);
          }
          return { incomes, expenses, labels };
        });

        const realityTrajectory = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return [];
          const allTxns = transactions();
          const startDate = new Date(scenario.startDate);
          const today = new Date();

          let baseline = accounts().reduce(
            (sum, acc) => sum + acc.initialBalance,
            0,
          );
          for (const t of allTxns) {
            const tDate = new Date(t.date);
            if (tDate < startDate) {
              baseline += t.type === 'income' ? t.amount : -t.amount;
            }
          }

          const monthlyMap = new Map<number, number>();
          for (const t of allTxns) {
            const tDate = new Date(t.date);
            if (tDate >= startDate && tDate <= today) {
              const monthIndex =
                (tDate.getFullYear() - startDate.getFullYear()) * 12 +
                (tDate.getMonth() - startDate.getMonth());
              if (monthIndex >= 0) {
                const current = monthlyMap.get(monthIndex) || 0;
                monthlyMap.set(
                  monthIndex,
                  current + (t.type === 'income' ? t.amount : -t.amount),
                );
              }
            }
          }

          const realHistory: number[] = [];
          let currentReal = baseline;
          const keys = Array.from(monthlyMap.keys());
          const maxMonth = keys.length > 0 ? Math.max(...keys) : -1;

          for (let i = 0; i <= maxMonth; i++) {
            const net = monthlyMap.get(i) || 0;
            currentReal += net;
            realHistory.push(currentReal);
          }
          return realHistory;
        });

        const budgetProgress = computed(() => {
          const now = new Date();
          const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const monthTxns = transactions().filter((t) =>
            t.date.startsWith(monthPrefix),
          );
          return budgets().map((b) => {
            const cat = categories().find((c) => c.id === b.categoryId);
            const spent = monthTxns
              .filter(
                (t) => t.categoryId === b.categoryId && t.type === 'expense',
              )
              .reduce((sum, t) => sum + t.amount, 0);
            return {
              budget: b,
              category: cat || null,
              spent,
              limit: b.monthlyLimit,
              remaining: b.monthlyLimit - spent,
              progress:
                b.monthlyLimit > 0 ? Math.min(spent / b.monthlyLimit, 1) : 0,
              overBudget: spent > b.monthlyLimit,
            };
          });
        });

        const maxProjectionMonths = computed(() =>
          scenarios().length > 0
            ? Math.max(...scenarios().map((s) => s.projectionYears)) * 12
            : 0,
        );

        const activeMonthlyCashFlow = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return { incomes: [], expenses: [], goalSaves: [] };
          const totalMonths = scenario.projectionYears * 12;
          const incomes: number[] = [];
          const expenses: number[] = [];
          const goalSaves: number[] = [];

          const activeGoals = (scenario.goals || []).filter(
            (g: Goal) => g.isEnabled !== false,
          );
          const goalFunds: number[] = new Array(activeGoals.length).fill(0);
          const goalAchieved: boolean[] = new Array(activeGoals.length).fill(
            false,
          );

          for (let month = 1; month <= totalMonths; month++) {
            let currentInc = 0;
            for (const inc of scenario.incomes) {
              if (inc.isEnabled === false) continue;
              if (
                month >= inc.startMonth &&
                (!inc.endMonth || month <= inc.endMonth)
              ) {
                let amount = inc.amount;
                const yPassed = Math.floor((month - inc.startMonth) / 12);
                if (inc.growthType === 'fixed')
                  amount += yPassed * inc.growthValue;
                else if (inc.growthType === 'percentage')
                  amount *= Math.pow(1 + inc.growthValue / 100, yPassed);
                currentInc += amount;
              }
            }
            incomes.push(currentInc);

            let currentExp = 0;
            const inflMult =
              scenario.inflationRate > 0
                ? Math.pow(
                    1 + scenario.inflationRate / 100,
                    Math.floor((month - 1) / 12),
                  )
                : 1;

            for (const exp of scenario.expenses) {
              if (exp.isEnabled === false) continue;
              const start = exp.startMonth || 1;
              if (month >= start) {
                if (!exp.monthsActive || month < start + exp.monthsActive) {
                  if ((month - start) % (exp.recurrenceInterval || 1) === 0) {
                    currentExp += exp.amount * inflMult;
                  }
                }
              }
            }

            for (const loan of scenario.loans || []) {
              if (loan.isEnabled === false) continue;
              if (
                month >= loan.startMonth &&
                month <= loan.startMonth + loan.termMonths - 1
              ) {
                currentExp += calculateMonthlyPayment(
                  loan.principal,
                  loan.annualInterestRate,
                  loan.termMonths,
                );
              }
            }

            let cashFlow = currentInc - currentExp;
            let goalSave = 0;

            for (let gi = 0; gi < activeGoals.length; gi++) {
              if (goalAchieved[gi]) continue;
              const g = activeGoals[gi];
              if (cashFlow > 0) {
                const remainingNeeded = g.amount - goalFunds[gi];
                const contrib = Math.min(remainingNeeded, cashFlow);
                goalFunds[gi] += contrib;
                cashFlow -= contrib;
                currentExp += contrib;
                goalSave += contrib;
                if (goalFunds[gi] >= g.amount) {
                  goalAchieved[gi] = true;
                }
              }
              if (cashFlow <= 0) break;
            }

            goalSaves.push(goalSave);
            expenses.push(currentExp);
          }
          return { incomes, expenses, goalSaves };
        });

        const activeOutflowBreakdown = computed(() => {
          const scenario = activeScenario();
          if (!scenario) return { labels: [], data: [] };
          const totalMonths = scenario.projectionYears * 12;
          const labels: string[] = [];
          const data: number[] = [];

          for (const exp of scenario.expenses) {
            if (exp.isEnabled === false) continue;
            labels.push(exp.name);
            let totalExpCost = 0;
            const start = exp.startMonth || 1;
            const end = exp.monthsActive
              ? Math.min(start + exp.monthsActive - 1, totalMonths)
              : totalMonths;

            for (let m = start; m <= end; m++) {
              if ((m - start) % (exp.recurrenceInterval || 1) !== 0) continue;
              const inflMult =
                scenario.inflationRate > 0
                  ? Math.pow(
                      1 + scenario.inflationRate / 100,
                      Math.floor((m - 1) / 12),
                    )
                  : 1;
              totalExpCost += exp.amount * inflMult;
            }
            data.push(totalExpCost);
          }

          for (const loan of scenario.loans || []) {
            if (loan.isEnabled === false) continue;
            const payment = calculateMonthlyPayment(
              loan.principal,
              loan.annualInterestRate,
              loan.termMonths,
            );
            const end = Math.min(
              loan.startMonth + loan.termMonths - 1,
              totalMonths,
            );
            const monthsActive = Math.max(0, end - loan.startMonth + 1);
            labels.push(`Debt: ${loan.name}`);
            data.push(payment * monthsActive);
          }

          const activeGoals = (scenario.goals || []).filter(
            (g: Goal) => g.isEnabled !== false,
          );
          const goalFunds: number[] = new Array(activeGoals.length).fill(0);
          const goalAchieved: boolean[] = new Array(activeGoals.length).fill(
            false,
          );

          for (let month = 1; month <= totalMonths; month++) {
            let cashFlow = 0;
            for (const inc of scenario.incomes) {
              if (inc.isEnabled === false) continue;
              if (
                month >= inc.startMonth &&
                (!inc.endMonth || month <= inc.endMonth)
              ) {
                cashFlow += inc.amount;
              }
            }
            for (const exp of scenario.expenses) {
              if (exp.isEnabled === false) continue;
              const start = exp.startMonth || 1;
              if (
                month >= start &&
                (!exp.monthsActive || month < start + exp.monthsActive)
              ) {
                if ((month - start) % (exp.recurrenceInterval || 1) === 0) {
                  cashFlow -= exp.amount;
                }
              }
            }
            for (const loan of scenario.loans || []) {
              if (loan.isEnabled === false) continue;
              if (
                month >= loan.startMonth &&
                month <= loan.startMonth + loan.termMonths - 1
              ) {
                cashFlow -= calculateMonthlyPayment(
                  loan.principal,
                  loan.annualInterestRate,
                  loan.termMonths,
                );
              }
            }
            for (let gi = 0; gi < activeGoals.length; gi++) {
              if (goalAchieved[gi]) continue;
              const g = activeGoals[gi];
              if (cashFlow > 0) {
                const remainingNeeded = g.amount - goalFunds[gi];
                const contrib = Math.min(remainingNeeded, cashFlow);
                goalFunds[gi] += contrib;
                cashFlow -= contrib;
                if (goalFunds[gi] >= g.amount) {
                  goalAchieved[gi] = true;
                }
              }
              if (cashFlow <= 0) break;
            }
          }

          for (let gi = 0; gi < activeGoals.length; gi++) {
            const g = activeGoals[gi];
            labels.push(`Goal: ${g.name}`);
            data.push(goalFunds[gi]);
          }
          return { labels, data };
        });

        const gamificationProfile = computed(() => {
          const balance = currentBalance();
          const goalsAchievedValue = realityGoalProgress()
            .filter((g) => g.status === 'achieved')
            .reduce((sum, g) => sum + g.amount, 0);

          const netWorth = balance + goalsAchievedValue;

          const levels = [
            { level: 1, title: 'Starter', minNetWorth: 0, maxNetWorth: 10000 },
            {
              level: 2,
              title: 'Saver',
              minNetWorth: 10000,
              maxNetWorth: 50000,
            },
            {
              level: 3,
              title: 'Investor',
              minNetWorth: 50000,
              maxNetWorth: 100000,
            },
            {
              level: 4,
              title: 'Wealth Builder',
              minNetWorth: 100000,
              maxNetWorth: 500000,
            },
            {
              level: 5,
              title: 'Strategist',
              minNetWorth: 500000,
              maxNetWorth: null,
            },
          ];

          let currentLvl = levels[0];
          for (const l of levels) {
            if (netWorth >= l.minNetWorth) currentLvl = l;
          }

          let progressPercentage = 100;
          if (currentLvl.maxNetWorth !== null) {
            const range = currentLvl.maxNetWorth - currentLvl.minNetWorth;
            const current = netWorth - currentLvl.minNetWorth;
            progressPercentage = Math.max(
              0,
              Math.min(100, (current / range) * 100),
            );
          }

          return {
            ...currentLvl,
            progressPercentage,
          } as FinancialLevel;
        });

        const unlockedAchievementsList = computed(() => {
          const achievedGoals = realityGoalProgress().filter(
            (g) => g.status === 'achieved',
          ).length;
          const netWorth =
            currentBalance() +
            realityGoalProgress()
              .filter((g) => g.status === 'achieved')
              .reduce((sum, g) => sum + g.amount, 0);

          const list: Achievement[] = [
            {
              id: 'first_goal',
              title: 'First Goal Down',
              description: 'Achieved your first financial goal.',
              icon: '🎯',
              unlocked: achievedGoals >= 1,
            },
            {
              id: 'goal_streak',
              title: 'Goal Crusher',
              description: 'Achieved 3 or more goals.',
              icon: '🔥',
              unlocked: achievedGoals >= 3,
            },
            {
              id: 'big_saver',
              title: 'Big Saver',
              description: 'Accumulated over $50k in Net Worth.',
              icon: '💰',
              unlocked: netWorth >= 50000,
            },
            {
              id: 'investor',
              title: 'Investor Status',
              description: 'Reached a Net Worth of $100k.',
              icon: '📈',
              unlocked: netWorth >= 100000,
            },
          ];

          return list;
        });

        return {
          activeScenario,
          chartDatasets,
          maxProjectionMonths,
          scenarioSummaries,
          activeGoalMilestones,
          currentProjectionMonth,
          currentGoalProgress,
          realityGoalProgress,
          projectedBalance,
          realityMonthlyCashFlow,
          realityTrajectory,
          activeMonthlyCashFlow,
          activeOutflowBreakdown,
          currentMonthPerformance,
          budgetProgress,
          gamificationProfile,
          unlockedAchievementsList,
        };
      },
    ),
  );
}
