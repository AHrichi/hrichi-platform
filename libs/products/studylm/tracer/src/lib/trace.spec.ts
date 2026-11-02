import { instrument } from './instrument';
import { runJavaScript, UNSUPPORTED_AWAIT } from './trace';

const BINARY_SEARCH = `function binarySearch(values, target) {
  let lo = 0;
  let hi = values.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (values[mid] === target) return mid;
    if (values[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

const EVENT_LOOP = `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`;

describe('runJavaScript', () => {
  it('traces binary search line by line, with its variables and stack', () => {
    const run = runJavaScript(BINARY_SEARCH, {
      call: 'console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 9))',
    });
    expect(run.error).toBeNull();
    expect(run.output).toBe('4');
    expect(run.frames[0]).toMatchObject({ line: 2, stack: ['binarySearch'] });
    const mids = run.frames
      .filter((f) => f.line === 6)
      .map((f) => f.vars.find((v) => v.name === 'mid')?.value);
    expect(mids).toEqual(['3', '5', '4']);
    // Three comparisons, as the lesson predicts: mid is 3, 5, then 4.
    const atReturn = run.frames.filter((f) => f.line === 6).at(-1);
    expect(atReturn?.vars.find((v) => v.name === 'values')?.value).toBe(
      '[1, 3, 5, 7, 9, 11, 13]',
    );
  });

  it('prints A D C B: sync, then microtasks, then tasks', () => {
    const run = runJavaScript(EVENT_LOOP);
    expect(run.output).toBe('A\nD\nC\nB');
    expect(run.events.map((e) => e.op)).toEqual([
      'push-stack',
      'log',
      'web-api',
      'queue-microtask',
      'log',
      'pop-stack',
      'run-microtask',
      'log',
      'pop-stack',
      'queue-task',
      'run-task',
      'log',
      'pop-stack',
    ]);
  });

  it('stops an infinite loop and runaway recursion', () => {
    expect(runJavaScript('while (true) {}').truncated).toBe(true);
    expect(runJavaScript('for (;;);').truncated).toBe(true);
    expect(runJavaScript('function f() { return f(); }\nf();').truncated).toBe(
      true,
    );
  });

  it('reports what the code throws', () => {
    const run = runJavaScript("console.log('before');\nnull.x;");
    expect(run.output).toBe('before');
    expect(run.error).toMatch(/TypeError/);
  });

  it('keeps the first 40 frames and counts the rest', () => {
    const run = runJavaScript(
      'let s = 0;\nfor (let i = 0; i < 100; i++) {\n  s += i;\n}',
    );
    expect(run.frames).toHaveLength(40);
    expect(run.totalFrames).toBeGreaterThan(100);
    expect(run.truncated).toBe(false);
  });

  it('says it can’t run await, rather than lose its continuations', () => {
    const run = runJavaScript(
      "async function f() { await null; console.log('after'); }\nf();",
    );
    expect(run.error).toBe(UNSUPPORTED_AWAIT);
  });

  it('runs Promise chains on the virtual loop', () => {
    const run = runJavaScript(
      "Promise.resolve(1).then((v) => v + 1).then((v) => console.log(v));\nconsole.log('sync');",
    );
    expect(run.output).toBe('sync\n2');
  });
});

describe('instrument', () => {
  it('adds braces around single-statement bodies, keeping the code valid', () => {
    const out = instrument('if (a) b();\nelse c();\nwhile (x) y();', 99);
    expect(() => new Function(out)).not.toThrow();
    expect(out).toContain('__slFrame(1,');
  });
});
