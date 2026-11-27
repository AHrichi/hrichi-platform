import { AR } from './copy.ar';
import { EN } from './copy.en';
import { FR } from './copy.fr';

type Leaf = string | ((...args: never[]) => string);

/** Every leaf of a copy, by its dotted path. */
function leaves(value: unknown, path = ''): Map<string, Leaf> {
  const out = new Map<string, Leaf>();
  if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      for (const [k, v] of leaves(item, path ? `${path}.${key}` : key)) {
        out.set(k, v);
      }
    }
  } else {
    out.set(path, value as Leaf);
  }
  return out;
}

const english = leaves(EN);

describe.each([
  ['French', FR],
  ['Arabic', AR],
])('%s copy', (_name, copy) => {
  const translated = leaves(copy);

  it('has every English string and nothing else', () => {
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('takes the same arguments and shows each of them', () => {
    for (const [path, write] of english) {
      const other = translated.get(path);
      if (typeof write !== 'function') {
        expect(typeof other, path).toBe('string');
        expect((other as string).trim().length, path).toBeGreaterThan(0);
        continue;
      }
      expect(typeof other, path).toBe('function');
      const fn = other as (...a: unknown[]) => string;
      expect(fn.length, path).toBe(write.length);
      const markers = Array.from({ length: write.length }, (_, i) => `‹${i}›`);
      const text = fn(...markers);
      for (const marker of markers) expect(text, path).toContain(marker);
    }
  });
});

describe('Arabic copy', () => {
  it('is written in Arabic, apart from codes and examples', () => {
    // The Arabic block, U+0600 to U+06FF.
    const arabic = new RegExp(
      `[${String.fromCharCode(0x0600)}-${String.fromCharCode(0x06ff)}]`,
    );
    for (const [path, value] of leaves(AR)) {
      const text = typeof value === 'function' ? value() : value;
      expect(arabic.test(text), path).toBe(true);
    }
  });
});
