import { newId, upsertById, withoutId } from './ids';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  it('makes v4 UUIDs', () => {
    expect(newId()).toMatch(UUID_V4);
    expect(newId()).not.toBe(newId());
  });

  it('makes them without randomUUID too (plain HTTP)', () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', {
      value: undefined,
      configurable: true,
    });
    try {
      expect(newId()).toMatch(UUID_V4);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', {
        value: original,
        configurable: true,
      });
    }
  });
});

describe('upsertById and withoutId', () => {
  const list = [
    { id: 'a', n: 1 },
    { id: 'b', n: 2 },
  ];

  it('replace in place or append, and never mutate', () => {
    expect(upsertById(list, { id: 'b', n: 3 })).toEqual([
      { id: 'a', n: 1 },
      { id: 'b', n: 3 },
    ]);
    expect(upsertById(list, { id: 'c', n: 4 })).toHaveLength(3);
    expect(withoutId(list, 'a')).toEqual([{ id: 'b', n: 2 }]);
    expect(list).toHaveLength(2);
  });
});
