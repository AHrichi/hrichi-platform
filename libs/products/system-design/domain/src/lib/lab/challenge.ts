import { LAB_CATALOG } from '../content/lab/catalog';
import type {
  ChallengeCheck,
  GoalCheck,
  LabChallenge,
  LabDesign,
  LabKind,
  Traffic,
} from './model';
import { labNodeLabel, simulate, withNodeDown } from './simulate';

/** The error budget a survival run must stay within when the challenge sets none. */
export const DEFAULT_SURVIVAL_ERROR_RATE = 0.01;

export const formatMs = (ms: number): string =>
  `${ms >= 100 ? ms.toFixed(0) : ms.toFixed(1)} ms`;
export const formatPercent = (x: number): string =>
  `${(x * 100).toFixed(x > 0 && x < 0.01 ? 2 : 1)}%`;

function kindList(kinds: readonly LabKind[]): string {
  const names = kinds.map((k) => LAB_CATALOG[k].label.toLowerCase());
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/**
 * Simulates the design and checks every goal. Survival goals re-run the
 * simulation with each eligible node down in turn; the design survives when
 * every run stays within the error budget.
 */
export function checkChallenge(
  challenge: LabChallenge,
  design: LabDesign,
  traffic: Traffic = challenge.traffic,
): ChallengeCheck {
  const result = simulate(design, traffic);
  const { goals } = challenge;
  const checks: GoalCheck[] = [];

  if (goals.maxP95 !== undefined)
    checks.push({
      id: 'maxP95',
      label: `p95 ≤ ${goals.maxP95} ms`,
      met: result.errorRate < 1 && result.p95 <= goals.maxP95,
      actual: formatMs(result.p95),
    });
  if (goals.maxErrorRate !== undefined)
    checks.push({
      id: 'maxErrorRate',
      label: `Errors ≤ ${formatPercent(goals.maxErrorRate)}`,
      met: result.errorRate <= goals.maxErrorRate,
      actual: formatPercent(result.errorRate),
    });
  if (goals.maxCost !== undefined)
    checks.push({
      id: 'maxCost',
      label: `Cost ≤ ${goals.maxCost}`,
      met: result.cost <= goals.maxCost,
      actual: String(result.cost),
    });
  if (goals.survivesAnySingleFailure?.length) {
    const budget = goals.maxErrorRate ?? DEFAULT_SURVIVAL_ERROR_RATE;
    const eligible = design.nodes.filter(
      (n) => !n.down && goals.survivesAnySingleFailure?.includes(n.kind),
    );
    let worst = { errorRate: result.errorRate, label: '' };
    for (const n of eligible) {
      const { errorRate } = simulate(withNodeDown(design, n.id), traffic);
      if (errorRate > worst.errorRate)
        worst = { errorRate, label: labNodeLabel(design, n) };
    }
    const met =
      eligible.length > 0 && result.errorRate < 1 && worst.errorRate <= budget;
    checks.push({
      id: 'survives',
      label: `Survives losing any one ${kindList(goals.survivesAnySingleFailure)}`,
      met,
      actual:
        eligible.length === 0
          ? 'nothing to lose'
          : worst.label
            ? `${formatPercent(worst.errorRate)} errors without ${worst.label}`
            : 'no extra errors',
    });
  }

  return { result, goals: checks, solved: checks.every((g) => g.met) };
}
