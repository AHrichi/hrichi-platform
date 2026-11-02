import { parse } from 'acorn';

/** An acorn node; only the fields the walk reads. */
interface Node {
  type: string;
  start: number;
  end: number;
  loc?: { start: { line: number } };
  [key: string]: unknown;
}

/** The hook names the instrumented code calls; the runtime provides them. */
export const HOOKS = {
  frame: '__slFrame',
  enter: '__slEnter',
  exit: '__slExit',
  /** Pops the stack and passes the value through: `return __slReturn(x)`. */
  ret: '__slReturn',
} as const;

interface Insert {
  at: number;
  text: string;
  /** Later inserts at the same spot go after earlier ones unless `before`. */
  order: number;
}

interface Scope {
  name: string;
  names: Set<string>;
}

const FUNCTIONS = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** Statement lists, and the single statements that need braces added. */
const LIST_FIELDS: Record<string, string> = {
  Program: 'body',
  BlockStatement: 'body',
  StaticBlock: 'body',
};
const SINGLE_FIELDS: Record<string, string[]> = {
  IfStatement: ['consequent', 'alternate'],
  ForStatement: ['body'],
  ForInStatement: ['body'],
  ForOfStatement: ['body'],
  WhileStatement: ['body'],
  DoWhileStatement: ['body'],
  LabeledStatement: ['body'],
};

/**
 * Rewrites a program so that, as it runs:
 * - every statement first reports its line and the variables in scope;
 * - every function reports entering and leaving, for the call stack;
 * - every loop body runs a hook each time round, so a step budget stops
 *   even `while (true) {}`.
 *
 * Only lines up to `lastLine` are traced; a call appended after the code
 * runs without frames of its own.
 */
export function instrument(code: string, lastLine: number): string {
  const ast = parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    locations: true,
  }) as unknown as Node;
  const inserts: Insert[] = [];
  let order = 0;
  const add = (at: number, text: string) =>
    inserts.push({ at, text, order: order++ });

  const declared = (fn: Node | null): Set<string> => {
    const names = new Set<string>();
    if (fn) {
      for (const param of (fn['params'] as Node[]) ?? [])
        collectPattern(param, names);
    }
    const body = fn ? (fn['body'] as Node) : ast;
    walkDeclarations(body, names);
    return names;
  };

  const frameCall = (line: number, scopes: Scope[]) => {
    const groups = scopes
      .map(
        (scope) =>
          `[${JSON.stringify(scope.name)},[${[...scope.names]
            .map((name) => `[${JSON.stringify(name)},()=>${name}]`)
            .join(',')}]]`,
      )
      .join(',');
    return `${HOOKS.frame}(${line},[${groups}]);`;
  };

  const visitStatement = (
    stmt: Node,
    scopes: Scope[],
    inList: boolean,
    parentLine = 0,
  ) => {
    const line = stmt.loc?.start.line ?? 0;
    // `if (x) return y;` is one line, so one frame: the if's.
    const traced =
      line <= lastLine &&
      line !== parentLine &&
      stmt.type !== 'FunctionDeclaration';
    if (!inList) {
      // Untraced, it still counts: a loop body must always spend budget.
      add(
        stmt.start,
        `{${traced ? frameCall(line, scopes) : `${HOOKS.frame}(0,[]);`}`,
      );
      add(stmt.end, '}');
    } else if (traced) {
      add(stmt.start, frameCall(line, scopes));
    }
    if (stmt.type === 'FunctionDeclaration') visitFunction(stmt, scopes);
    else visitNode(stmt, scopes);
  };

  const visitFunction = (fn: Node, scopes: Scope[]) => {
    const name =
      ((fn['id'] as Node | null)?.['name'] as string | undefined) ??
      'anonymous';
    const inner = [...scopes, { name, names: declared(fn) }];
    const body = fn['body'] as Node;
    // No try/finally: Sval loses a return inside one. Each return pops the
    // stack instead, and so does falling off the end.
    if (body.type === 'BlockStatement') {
      add(body.start + 1, `${HOOKS.enter}(${JSON.stringify(name)});`);
      add(body.end - 1, `${HOOKS.exit}();`);
      visitNode(body, inner);
    } else {
      add(
        body.start,
        `{${HOOKS.enter}(${JSON.stringify(name)});return ${HOOKS.ret}((`,
      );
      add(body.end, `));}`);
      visitNode(body, inner);
    }
  };

  const visitNode = (node: Node, scopes: Scope[]) => {
    if (node.type === 'ReturnStatement') {
      const arg = node['argument'] as Node | null;
      if (arg) {
        add(arg.start, `${HOOKS.ret}(`);
        add(arg.end, ')');
      } else {
        add(node.start + 'return'.length, ` ${HOOKS.ret}(undefined)`);
      }
    }
    const list = LIST_FIELDS[node.type];
    if (list) {
      for (const stmt of node[list] as Node[])
        visitStatement(stmt, scopes, true);
      return;
    }
    if (node.type === 'SwitchCase') {
      for (const child of node['test'] ? [node['test'] as Node] : [])
        visitNode(child, scopes);
      for (const stmt of node['consequent'] as Node[])
        visitStatement(stmt, scopes, true);
      return;
    }
    const singles = SINGLE_FIELDS[node.type] ?? [];
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || !value || typeof value !== 'object') continue;
      const children = Array.isArray(value) ? value : [value];
      for (const child of children as Node[]) {
        if (!child || typeof child.type !== 'string') continue;
        if (FUNCTIONS.has(child.type)) {
          visitFunction(child, scopes);
        } else if (singles.includes(key) && child.type !== 'BlockStatement') {
          visitStatement(child, scopes, false, node.loc?.start.line ?? 0);
        } else if (singles.includes(key)) {
          // A loop body block: count each time round, even when empty.
          if (child.type === 'BlockStatement' && node.type !== 'IfStatement') {
            add(child.start + 1, `${HOOKS.frame}(0,[]);`);
          }
          visitNode(child, scopes);
        } else {
          visitNode(child, scopes);
        }
      }
    }
  };

  visitNode(ast, [{ name: 'global', names: declared(null) }]);

  inserts.sort((a, b) => a.at - b.at || a.order - b.order);
  let out = '';
  let from = 0;
  for (const insert of inserts) {
    out += code.slice(from, insert.at) + insert.text;
    from = insert.at;
  }
  return out + code.slice(from);
}

/** Names a pattern binds: `x`, `[a, b]`, `{ c, d: e }`, `...rest`, `f = 1`. */
function collectPattern(node: Node | null, names: Set<string>): void {
  if (!node) return;
  switch (node.type) {
    case 'Identifier':
      names.add(node['name'] as string);
      break;
    case 'ArrayPattern':
      for (const el of node['elements'] as (Node | null)[])
        collectPattern(el, names);
      break;
    case 'ObjectPattern':
      for (const prop of node['properties'] as Node[]) {
        collectPattern(
          (prop.type === 'RestElement'
            ? prop['argument']
            : prop['value']) as Node,
          names,
        );
      }
      break;
    case 'RestElement':
      collectPattern(node['argument'] as Node, names);
      break;
    case 'AssignmentPattern':
      collectPattern(node['left'] as Node, names);
      break;
  }
}

/** Declarations in a function's own body, not inside nested functions. */
function walkDeclarations(node: Node, names: Set<string>): void {
  if (node.type === 'VariableDeclaration') {
    for (const decl of node['declarations'] as Node[]) {
      collectPattern(decl['id'] as Node, names);
    }
  }
  if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    const id = node['id'] as Node | null;
    if (id) names.add(id['name'] as string);
  }
  if (node.type === 'CatchClause') collectPattern(node['param'] as Node, names);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || !value || typeof value !== 'object') continue;
    for (const child of (Array.isArray(value) ? value : [value]) as Node[]) {
      if (!child || typeof child.type !== 'string') continue;
      if (FUNCTIONS.has(child.type)) {
        // A nested function's name belongs here; its insides don't.
        const id = child['id'] as Node | null;
        if (child.type === 'FunctionDeclaration' && id) {
          names.add(id['name'] as string);
        }
        continue;
      }
      walkDeclarations(child, names);
    }
  }
}
