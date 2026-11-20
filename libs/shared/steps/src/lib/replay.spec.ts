import { type OpStep, upTo } from './replay';

const steps: OpStep<string>[] = [
  { ops: ['a', 'b'] },
  { ops: [] },
  { ops: ['c'] },
  { ops: ['d'] },
];

function replay(n: number): [string, boolean][] {
  const seen: [string, boolean][] = [];
  upTo(steps, n, (op, current) => seen.push([op, current]));
  return seen;
}

describe('upTo', () => {
  it('applies nothing before the first step', () => {
    expect(replay(-1)).toEqual([]);
  });

  it('applies the ops of every step up to n, in order', () => {
    expect(replay(2)).toEqual([
      ['a', false],
      ['b', false],
      ['c', true],
    ]);
  });

  it('marks only the ops of step n as current', () => {
    expect(replay(0)).toEqual([
      ['a', true],
      ['b', true],
    ]);
  });

  it('stops at the last step when n runs past the end', () => {
    expect(
      replay(99).map(([op, current]) => `${op}${current ? '*' : ''}`),
    ).toEqual(['a', 'b', 'c', 'd*']);
  });

  it('does nothing for an empty list', () => {
    const apply = vi.fn();
    upTo([], 3, apply);
    expect(apply).not.toHaveBeenCalled();
  });
});
