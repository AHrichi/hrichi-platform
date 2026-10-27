import { GoalMilestone, Goal, Scenario } from './models';

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (termMonths <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return (
    (principal * (r * Math.pow(1 + r, termMonths))) /
    (Math.pow(1 + r, termMonths) - 1)
  );
}

export interface ScenarioProjection {
  history: number[];
  dateLabels: string[];
  totalIncome: number;
  totalExpenses: number;
  totalGoals: number;
  goalMilestones: GoalMilestone[];
}

export interface ProjectionOverrides {
  incomeMult?: number;
  expenseMult?: number;
  inflationOverride?: number;
  yieldOverride?: number;
}

export function computeScenarioProjection(
  scenario: Scenario,
  currentBalance: number,
  startDateObj: Date,
  overrides?: ProjectionOverrides,
): ScenarioProjection {
  const totalMonths = scenario.projectionYears * 12;

  const activeYield =
    overrides?.yieldOverride !== undefined
      ? overrides.yieldOverride
      : scenario.investmentYield;
  const monthlyInterestRate = activeYield > 0 ? activeYield / 100 / 12 : 0;

  const activeInflation =
    overrides?.inflationOverride !== undefined
      ? overrides.inflationOverride
      : scenario.inflationRate;

  const incMult = overrides?.incomeMult ?? 1;
  const expMult = overrides?.expenseMult ?? 1;

  const activeGoals = (scenario.goals || []).filter(
    (g: Goal) => g.isEnabled !== false,
  );
  const goalFunds: number[] = new Array(activeGoals.length).fill(0);
  const goalAchievedMonth: (number | null)[] = new Array(
    activeGoals.length,
  ).fill(null);
  const goalAchieved: boolean[] = new Array(activeGoals.length).fill(false);

  const history: number[] = [];
  const dateLabels: string[] = [];
  let totalInc = 0;
  let totalExp = 0;
  let totalAccumulated = currentBalance;

  // Pre-fund goals with currentBalance (Month 0 allocation)
  for (let gi = 0; gi < activeGoals.length; gi++) {
    const g = activeGoals[gi];
    if (totalAccumulated > 0) {
      const needed = g.amount;
      if (totalAccumulated >= needed) {
        goalFunds[gi] = needed;
        goalAchievedMonth[gi] = 0;
        goalAchieved[gi] = true;
        totalAccumulated -= needed;
      } else {
        goalFunds[gi] = totalAccumulated;
        totalAccumulated = 0;
      }
    } else {
      break;
    }
  }

  for (let month = 1; month <= totalMonths; month++) {
    totalAccumulated += totalAccumulated * monthlyInterestRate;

    let currentMonthIncome = 0;
    for (const inc of scenario.incomes) {
      if (inc.isEnabled === false) continue;
      if (month >= inc.startMonth && (!inc.endMonth || month <= inc.endMonth)) {
        let amount = inc.amount;
        const yPassed = Math.floor((month - inc.startMonth) / 12);
        if (inc.growthType === 'fixed') amount += yPassed * inc.growthValue;
        else if (inc.growthType === 'percentage')
          amount *= Math.pow(1 + inc.growthValue / 100, yPassed);
        currentMonthIncome += amount * incMult;
      }
    }
    totalInc += currentMonthIncome;

    let currentMonthExpenses = 0;
    const inflMult =
      activeInflation > 0
        ? Math.pow(1 + activeInflation / 100, Math.floor((month - 1) / 12))
        : 1;

    for (const exp of scenario.expenses) {
      if (exp.isEnabled === false) continue;
      const start = exp.startMonth || 1;
      if (month >= start) {
        if (!exp.monthsActive || month < start + exp.monthsActive) {
          if ((month - start) % (exp.recurrenceInterval || 1) === 0) {
            currentMonthExpenses += exp.amount * inflMult * expMult;
          }
        }
      }
    }

    for (const loan of scenario.loans || []) {
      if (loan.isEnabled === false) continue;
      const endMonth = loan.startMonth + loan.termMonths - 1;
      if (month >= loan.startMonth && month <= endMonth) {
        currentMonthExpenses += calculateMonthlyPayment(
          loan.principal,
          loan.annualInterestRate,
          loan.termMonths,
        );
      }
    }

    let cashFlow = currentMonthIncome - currentMonthExpenses;

    for (let gi = 0; gi < activeGoals.length; gi++) {
      if (goalAchieved[gi]) continue;
      const g = activeGoals[gi];

      if (cashFlow > 0) {
        const remainingNeeded = g.amount - goalFunds[gi];
        const contrib = Math.min(remainingNeeded, cashFlow);
        goalFunds[gi] += contrib;
        cashFlow -= contrib;
        currentMonthExpenses += contrib;

        if (goalFunds[gi] >= g.amount) {
          goalAchievedMonth[gi] = month;
          goalAchieved[gi] = true;
        }
      }

      if (cashFlow <= 0) break;
    }

    totalExp += currentMonthExpenses;
    totalAccumulated += cashFlow;

    let remaining = totalAccumulated;
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
    totalAccumulated = remaining;

    const currentGoalFundsTotal = goalFunds.reduce((sum, val) => sum + val, 0);
    history.push(totalAccumulated + currentGoalFundsTotal);

    const d = new Date(
      startDateObj.getFullYear(),
      startDateObj.getMonth() + (month - 1),
      1,
    );
    dateLabels.push(
      d.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    );
  }

  const goalMilestones: GoalMilestone[] = activeGoals.map((g, i) => {
    let status: GoalMilestone['status'];

    if (goalAchievedMonth[i] !== null) {
      status = 'achieved';
    } else {
      let isReceivingCashFlow = false;
      for (let j = 0; j <= i; j++) {
        if (goalAchievedMonth[j] === null) {
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

  const totalGoals = activeGoals.reduce(
    (sum: number, g: Goal) => sum + g.amount,
    0,
  );

  return {
    history,
    dateLabels,
    totalIncome: totalInc,
    totalExpenses: totalExp,
    totalGoals,
    goalMilestones,
  };
}
