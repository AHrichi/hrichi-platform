import { describe, expect, it } from 'vitest';
import { AR } from './copy.ar';
import { DE } from './copy.de';
import { EN } from './copy.en';
import { FR } from './copy.fr';
import { IT } from './copy.it';

// `fields`, `hints` and `notes` are typed as records, so the compiler can't
// tell when a translation misses one of their keys. These tests can.
const TRANSLATIONS = { fr: FR, ar: AR, it: IT, de: DE } as const;

type Leaf = string | ((...args: never[]) => string);

/** Every leaf of a copy, by its dotted path. */
function leaves(value: unknown, path = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      // Guide tools are matched by id, not by position.
      const key =
        typeof item === 'object' && item && 'id' in item ? item.id : i;
      for (const [k, v] of leaves(item, `${path}[${key}]`)) out.set(k, v);
    });
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      for (const [k, v] of leaves(item, path ? `${path}.${key}` : key)) {
        out.set(k, v);
      }
    }
  } else {
    out.set(path, value);
  }
  return out;
}

/**
 * What a writer puts in its sentence: the note values it reads (`v['pct']`)
 * or the markers of the arguments it shows.
 */
function placeholders(path: string, write: Leaf): string[] {
  if (typeof write !== 'function') return [];
  if (path.startsWith('notes.')) {
    const read = new Set<string>();
    const values = new Proxy(
      {},
      {
        get: (_target, key) => {
          read.add(String(key));
          return `‹${String(key)}›`;
        },
      },
    );
    (write as (v: Record<string, string>) => string)(values);
    return [...read].sort();
  }
  // Numbers for counts (backup), distinct markers for everything else.
  const args = Array.from({ length: write.length }, (_, i) =>
    path.startsWith('backup.') ? 7 + i : `‹${i}›`,
  );
  const text = (write as (...a: unknown[]) => string)(...args);
  return args.map(String).filter((arg) => text.includes(arg));
}

const english = leaves(EN);

describe.each(Object.entries(TRANSLATIONS))('the %s copy', (_lang, copy) => {
  const translated = leaves(copy);

  it('has every key of the English copy, and no other', () => {
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('says something for every key', () => {
    for (const [path, value] of translated) {
      if (typeof value === 'string') {
        expect(value.trim(), path).not.toBe('');
      } else {
        expect(typeof value, path).toBe('function');
      }
    }
  });

  it('keeps every number and name the English sentence shows', () => {
    for (const [path, value] of english) {
      if (typeof value !== 'function') continue;
      const theirs = translated.get(path) as Leaf;
      expect(typeof theirs, path).toBe('function');
      expect(placeholders(path, theirs), path).toEqual(
        placeholders(path, value as Leaf),
      );
    }
  });

  it('lists the guide tools in the same order', () => {
    expect(copy.guide.tools.map((tool) => tool.id)).toEqual(
      EN.guide.tools.map((tool) => tool.id),
    );
    expect(copy.months).toHaveLength(12);
    expect(copy.monthsShort).toHaveLength(12);
  });
});

describe('the Arabic copy', () => {
  it('writes numbers in Latin digits, as the number fields do', () => {
    const arabicIndic = /[٠-٩۰-۹]/;
    for (const [path, value] of leaves(AR)) {
      if (typeof value === 'string') {
        expect(arabicIndic.test(value), path).toBe(false);
      }
    }
  });
});
