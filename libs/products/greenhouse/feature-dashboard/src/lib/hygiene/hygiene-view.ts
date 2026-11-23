import type { FarmHygiene } from '@ah/products/greenhouse/data-access';
import {
  type CheckStatus,
  checkStatus,
  type Greenhouse,
  type HygieneAnswer,
  type HygieneCheck,
  type HygieneItem,
  type HygieneProgress,
  hygieneProgress,
  type Member,
} from '@ah/products/greenhouse/domain';

export interface CheckRow {
  greenhouse: Greenhouse;
  check: HygieneCheck | null;
  status: CheckStatus;
  progress: HygieneProgress;
  /** Who filled it in, by name; null if unknown (left the farm). */
  supervisor: string | null;
}

export interface AnswerRow {
  item: HygieneItem;
  answer: HygieneAnswer;
}

export interface HygieneView {
  rows: CheckRow[];
  signed: number;
  open: number;
  missing: number;
  /** Items answered "not fine", every greenhouse together. */
  failed: number;
}

/**
 * The day's hygiene, one row per active greenhouse: its check (or none),
 * how far it got, and who did it. Greenhouses with a failed item come
 * first, then the unsigned, so the manager sees what needs them.
 */
export function buildHygieneView(
  hygiene: FarmHygiene,
  greenhouses: readonly Greenhouse[],
  members: readonly Member[],
): HygieneView {
  const byGreenhouse = new Map(hygiene.checks.map((c) => [c.greenhouseId, c]));
  const names = new Map(members.map((m) => [m.userId, m.fullName]));
  const urgency = (row: CheckRow): number =>
    row.progress.failed > 0 ? 0 : row.status === 'signed' ? 2 : 1;

  const rows = greenhouses
    .filter((g) => g.active)
    .map((greenhouse): CheckRow => {
      const check = byGreenhouse.get(greenhouse.id) ?? null;
      return {
        greenhouse,
        check,
        status: checkStatus(check),
        progress: hygieneProgress(hygiene.items, check?.answers ?? []),
        supervisor: check ? (names.get(check.supervisorId) ?? null) : null,
      };
    })
    .sort(
      (a, b) =>
        urgency(a) - urgency(b) ||
        a.greenhouse.name.localeCompare(b.greenhouse.name, undefined, {
          numeric: true,
        }),
    );

  return {
    rows,
    signed: rows.filter((r) => r.status === 'signed').length,
    open: rows.filter((r) => r.status === 'open').length,
    missing: rows.filter((r) => r.status === 'missing').length,
    failed: rows.reduce((n, r) => n + r.progress.failed, 0),
  };
}

/**
 * A check's answers in checklist order. Answers to items since retired
 * still show (the check was made against them); answers to items the
 * farm no longer has at all are left out.
 */
export function answerRows(
  check: HygieneCheck,
  items: readonly HygieneItem[],
): AnswerRow[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return check.answers
    .map((answer) => ({ item: byId.get(answer.itemId), answer }))
    .filter((row): row is AnswerRow => row.item !== undefined)
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder);
}
