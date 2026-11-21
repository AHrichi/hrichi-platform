import type { Check, CheckResponse } from '../model/checks';

export interface Marked {
  correct: boolean;
  /** The right answer, as the learner should read it. */
  expected: string;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('en') : String(n);
}

/** Marks one answer. A response of the wrong shape is simply wrong. */
export function markCheck(check: Check, response: CheckResponse): Marked {
  switch (check.kind) {
    case 'choice':
      return {
        correct: response === check.answer,
        expected: check.options[check.answer] ?? '',
      };
    case 'numeric': {
      const ok =
        typeof response === 'number' &&
        Number.isFinite(response) &&
        Math.abs(response - check.answer) <=
          check.tolerance * Math.abs(check.answer);
      return {
        correct: ok,
        expected: `${formatNumber(check.answer)} ${check.unit}`.trim(),
      };
    }
    case 'order': {
      const ok =
        Array.isArray(response) &&
        response.length === check.items.length &&
        response.every((item, i) => item === check.items[i]);
      return { correct: ok, expected: check.items.join(' → ') };
    }
  }
}
