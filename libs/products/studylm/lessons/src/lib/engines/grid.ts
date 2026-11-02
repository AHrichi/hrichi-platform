import type { BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';
import type { OpOf } from './contracts';
import { StepList, upTo } from './steps';

type GridBlock = BlockOf<'grid'>;
type GridOp = OpOf<'grid'>;
type Cell = [number, number];

export interface GridState {
  /** One character per cell: ".", "#", "S", "G" or a digit. */
  cells: string[][];
  /** Values written into cells (DP tables, distances). */
  values: (string | null)[][];
  visited: boolean[][];
  frontier: boolean[][];
  path: boolean[][];
  /** For lcs: the strings along the side and the top. */
  labels: { rows: string; cols: string } | null;
  /** This step only. */
  active: Cell[];
}

function op(fields: Partial<GridOp> & Pick<GridOp, 'op'>): GridOp {
  return { row: null, col: null, value: null, ...fields };
}

const at = (
  o: 'visit' | 'frontier' | 'path' | 'compare' | 'wall',
  [row, col]: Cell,
) => op({ op: o, row, col });

/** The grid a block starts from; lcs builds an empty table from its strings. */
export function gridCells(block: GridBlock): string[][] {
  const sim = block.simulate;
  if (sim?.algorithm === 'lcs') {
    const rows = (sim.a ?? '').length + 1;
    const cols = (sim.b ?? '').length + 1;
    return Array.from({ length: rows }, () => Array(cols).fill('.'));
  }
  return block.rows.map((row) => [...row]);
}

export function gridStateAt(
  block: GridBlock,
  n: number,
  steps: readonly Step<GridOp>[] = simulateGrid(block),
): GridState {
  const cells = gridCells(block);
  const blank = <T>(fill: T) => cells.map((row) => row.map(() => fill));
  const state: GridState = {
    cells,
    values: blank<string | null>(null),
    visited: blank(false),
    frontier: blank(false),
    path: blank(false),
    labels:
      block.simulate?.algorithm === 'lcs'
        ? { rows: block.simulate.a ?? '', cols: block.simulate.b ?? '' }
        : null,
    active: [],
  };
  upTo(steps, n, (o, current) => {
    if (o.row === null || o.col === null) return;
    const { row, col } = o;
    if (!cells[row] || cells[row][col] === undefined) return;
    switch (o.op) {
      case 'visit':
        state.visited[row][col] = true;
        state.frontier[row][col] = false;
        break;
      case 'frontier':
        state.frontier[row][col] = true;
        break;
      case 'set':
        state.values[row][col] = o.value;
        break;
      case 'path':
        state.path[row][col] = true;
        break;
      case 'wall':
        cells[row][col] = '#';
        break;
      case 'compare':
        break;
    }
    if (current) state.active.push([row, col]);
  });
  return state;
}

const DIRS: Cell[] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

function find(cells: string[][], ch: string): Cell | null {
  for (let r = 0; r < cells.length; r++) {
    const c = cells[r].indexOf(ch);
    if (c >= 0) return [r, c];
  }
  return null;
}

const key = ([r, c]: Cell) => `${r},${c}`;

/** Steps for a grid block's `simulate`; its own steps otherwise. */
export function simulateGrid(block: GridBlock): Step<GridOp>[] {
  const sim = block.simulate;
  if (!sim) return block.steps;
  const cells = gridCells(block);
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const inside = ([r, c]: Cell) => r >= 0 && c >= 0 && r < rows && c < cols;
  const open = (cell: Cell) => inside(cell) && cells[cell[0]][cell[1]] !== '#';
  const near = ([r, c]: Cell) =>
    DIRS.map(([dr, dc]): Cell => [r + dr, c + dc]).filter(open);
  const out = new StepList<GridOp>();
  const walkBack = (from: Map<string, Cell>, goal: Cell) => {
    const route: Cell[] = [goal];
    let at2 = from.get(key(goal));
    while (at2) {
      route.unshift(at2);
      at2 = from.get(key(at2));
    }
    return route;
  };

  switch (sim.algorithm) {
    case 'grid-bfs':
    case 'flood-fill': {
      const start = find(cells, 'S') ?? ([0, 0] as Cell);
      const goal = sim.algorithm === 'grid-bfs' ? find(cells, 'G') : null;
      const fill = cells[start[0]][start[1]];
      const same = (cell: Cell) =>
        sim.algorithm === 'grid-bfs' || cells[cell[0]][cell[1]] === fill;
      const from = new Map<string, Cell>();
      const seen = new Set([key(start)]);
      const queue: Cell[] = [start];
      const dist = new Map([[key(start), 0]]);
      out.add(
        'Start',
        sim.algorithm === 'grid-bfs'
          ? 'Begin at S. Each round reaches every cell one more move away.'
          : 'Begin here and spread to every touching cell of the same kind.',
        [at('frontier', start)],
      );
      while (queue.length) {
        const cell = queue.shift() as Cell;
        const fresh = near(cell).filter((c) => same(c) && !seen.has(key(c)));
        fresh.forEach((c) => {
          seen.add(key(c));
          from.set(key(c), cell);
          dist.set(key(c), (dist.get(key(cell)) ?? 0) + 1);
        });
        queue.push(...fresh);
        const d = dist.get(key(cell)) ?? 0;
        out.add(
          `Visit (${cell[0]}, ${cell[1]})`,
          sim.algorithm === 'grid-bfs'
            ? `${d} move${d === 1 ? '' : 's'} from S. ${fresh.length} new neighbour${fresh.length === 1 ? '' : 's'} join the frontier.`
            : `Fill it; ${fresh.length} touching cell${fresh.length === 1 ? '' : 's'} join the frontier.`,
          [
            at('visit', cell),
            ...(sim.algorithm === 'grid-bfs'
              ? [
                  op({
                    op: 'set',
                    row: cell[0],
                    col: cell[1],
                    value: String(d),
                  }),
                ]
              : []),
            ...fresh.slice(0, 4).map((c) => at('frontier', c)),
          ],
        );
        if (goal && key(cell) === key(goal)) {
          const route = walkBack(from, goal);
          out.add(
            `Reached G in ${d} moves`,
            `BFS reached G first along a shortest path: ${d} moves. Follow the steps back to S to see it.`,
            route.map((c) => at('path', c)).slice(0, 40),
          );
          return out.list;
        }
      }
      if (goal) {
        out.add(
          'No path',
          'The frontier ran out before reaching G: walls cut it off.',
          [],
        );
      }
      return out.list;
    }
    case 'a-star': {
      const start = find(cells, 'S');
      const goal = find(cells, 'G');
      if (!start || !goal) return [];
      const h = ([r, c]: Cell) => Math.abs(r - goal[0]) + Math.abs(c - goal[1]);
      const g = new Map([[key(start), 0]]);
      const from = new Map<string, Cell>();
      const openSet: Cell[] = [start];
      const closed = new Set<string>();
      out.add(
        'Start',
        'A* expands the cell with the lowest f = moves so far + estimated moves left (the Manhattan distance to G).',
        [
          at('frontier', start),
          op({
            op: 'set',
            row: start[0],
            col: start[1],
            value: String(h(start)),
          }),
        ],
      );
      while (openSet.length) {
        openSet.sort(
          (a, b) =>
            (g.get(key(a)) ?? 0) + h(a) - ((g.get(key(b)) ?? 0) + h(b)) ||
            h(a) - h(b),
        );
        const cell = openSet.shift() as Cell;
        if (closed.has(key(cell))) continue;
        closed.add(key(cell));
        const gc = g.get(key(cell)) ?? 0;
        if (key(cell) === key(goal)) {
          const route = walkBack(from, goal);
          out.add(
            `Reached G in ${gc} moves`,
            'The goal came off the open list, so its path is the shortest.',
            [at('visit', cell), ...route.map((c) => at('path', c))].slice(
              0,
              40,
            ),
          );
          return out.list;
        }
        const ops = [at('visit', cell)];
        for (const next of near(cell)) {
          if (closed.has(key(next))) continue;
          const cost = gc + 1;
          if (cost < (g.get(key(next)) ?? Infinity)) {
            g.set(key(next), cost);
            from.set(key(next), cell);
            openSet.push(next);
            ops.push(
              at('frontier', next),
              op({
                op: 'set',
                row: next[0],
                col: next[1],
                value: String(cost + h(next)),
              }),
            );
          }
        }
        out.add(
          `Expand (${cell[0]}, ${cell[1]})`,
          `Its f is ${gc + h(cell)}: ${gc} moves made, about ${h(cell)} to go. Neighbours get their f.`,
          ops,
        );
      }
      out.add(
        'No path',
        'The open list emptied before G: it cannot be reached.',
        [],
      );
      return out.list;
    }
    case 'unique-paths':
    case 'min-path-sum': {
      const sum = sim.algorithm === 'min-path-sum';
      const dp: (number | null)[][] = cells.map((row) => row.map(() => null));
      const cost = (r: number, c: number) => Number(cells[r][c]) || 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (cells[r][c] === '#') continue;
          const up = r > 0 ? dp[r - 1][c] : null;
          const left = c > 0 ? dp[r][c - 1] : null;
          let value: number;
          let why: string;
          if (r === 0 && c === 0) {
            value = sum ? cost(0, 0) : 1;
            why = sum
              ? `The start costs ${value}.`
              : 'One way to be at the start: begin there.';
          } else if (sum) {
            const best = Math.min(up ?? Infinity, left ?? Infinity);
            value = best === Infinity ? Infinity : best + cost(r, c);
            why =
              value === Infinity
                ? 'Unreachable: no open cell above or to the left.'
                : `${cost(r, c)} plus the cheaper of above (${up ?? '—'}) and left (${left ?? '—'}): ${value}.`;
          } else {
            value = (up ?? 0) + (left ?? 0);
            why = `Ways from above (${up ?? 0}) plus ways from the left (${left ?? 0}): ${value}.`;
          }
          dp[r][c] = value;
          out.add(`Cell (${r}, ${c})`, why, [
            ...(up !== null ? [at('compare', [r - 1, c])] : []),
            ...(left !== null ? [at('compare', [r, c - 1])] : []),
            op({
              op: 'set',
              row: r,
              col: c,
              value: value === Infinity ? '∞' : String(value),
            }),
          ]);
        }
      }
      const end = dp[rows - 1]?.[cols - 1];
      out.add(
        sum ? `Cheapest path: ${end}` : `${end} paths`,
        sum
          ? 'The bottom-right cell holds the cheapest total, built from smaller answers.'
          : 'The bottom-right cell holds the number of paths, built from smaller answers.',
        [at('path', [rows - 1, cols - 1])],
      );
      return out.list;
    }
    case 'lcs': {
      const a = sim.a ?? '';
      const b = sim.b ?? '';
      const dp = Array.from(
        { length: a.length + 1 },
        () => Array(b.length + 1).fill(0) as number[],
      );
      out.add(
        'Empty prefixes',
        'Row 0 and column 0 compare against an empty string: the common part has length 0.',
        [],
      );
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const match = a[i - 1] === b[j - 1];
          dp[i][j] = match
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1]);
          out.add(
            `${a[i - 1]} vs ${b[j - 1]}`,
            match
              ? `They match: one more than the diagonal, ${dp[i][j]}.`
              : `No match: the larger of above (${dp[i - 1][j]}) and left (${dp[i][j - 1]}), ${dp[i][j]}.`,
            [
              at('compare', match ? [i - 1, j - 1] : [i - 1, j]),
              ...(match ? [] : [at('compare', [i, j - 1])]),
              op({ op: 'set', row: i, col: j, value: String(dp[i][j]) }),
            ],
          );
        }
      }
      out.add(
        `Longest common subsequence: ${dp[a.length][b.length]}`,
        `The bottom-right cell is the answer for the whole of "${a}" and "${b}".`,
        [at('path', [a.length, b.length])],
      );
      return out.list;
    }
  }
}
