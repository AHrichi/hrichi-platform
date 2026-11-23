import {
  sampleHygieneChecks,
  sampleHygieneItems,
  SAMPLE_GREENHOUSES,
} from '@ah/products/greenhouse/domain';
import { answerRows, buildHygieneView } from './hygiene-view';

const TODAY = '2026-11-23';
const items = sampleHygieneItems();
const members = [
  { userId: 'sup-2', fullName: 'Supervisor A2', role: 'supervisor' as const },
];

describe('buildHygieneView', () => {
  it('puts failed checks first, then unsigned, and counts each', () => {
    const view = buildHygieneView(
      { date: TODAY, items, checks: sampleHygieneChecks(TODAY, TODAY) },
      SAMPLE_GREENHOUSES,
      members,
    );
    expect(view.rows.map((r) => [r.greenhouse.name, r.status])).toEqual([
      ['A2', 'signed'],
      ['B3', 'open'],
      ['B4', 'missing'],
      ['A1', 'signed'],
      ['A3', 'signed'],
      ['A4', 'signed'],
      ['B1', 'signed'],
      ['B2', 'signed'],
    ]);
    expect(view).toMatchObject({ signed: 6, open: 1, missing: 1, failed: 1 });
    expect(view.rows[0]?.supervisor).toBe('Supervisor A2');
    expect(view.rows[1]?.progress).toMatchObject({ answered: 3, total: 8 });
  });

  it('leaves archived greenhouses out', () => {
    const view = buildHygieneView(
      { date: TODAY, items, checks: [] },
      SAMPLE_GREENHOUSES.map((g) => ({ ...g, active: g.id !== 'gh-1' })),
      [],
    );
    expect(view.rows).toHaveLength(7);
    expect(view.missing).toBe(7);
  });
});

describe('answerRows', () => {
  it('keeps checklist order and answers to retired items', () => {
    const [check] = sampleHygieneChecks('2026-11-20', TODAY);
    if (!check) throw new Error('No sample check');
    const retired = items.map((i) =>
      i.id === 'hyg-2' ? { ...i, active: false } : i,
    );
    const rows = answerRows(
      { ...check, answers: [...check.answers].reverse() },
      retired.filter((i) => i.id !== 'hyg-8'),
    );
    expect(rows.map((r) => r.item.id)).toEqual([
      'hyg-1',
      'hyg-2',
      'hyg-3',
      'hyg-4',
      'hyg-5',
      'hyg-6',
      'hyg-7',
    ]);
  });
});
