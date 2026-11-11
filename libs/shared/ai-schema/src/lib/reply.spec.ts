import * as v from 'valibot';
import { conforms, parseReply, tidy } from './reply';
import { strictJsonSchema } from './strict-schema';

const schema = strictJsonSchema(
  v.strictObject({
    verdict: v.picklist(['nailed', 'close', 'missed']),
    note: v.nullable(v.string()),
    points: v.array(v.strictObject({ text: v.string(), weight: v.number() })),
  }),
);

describe('parseReply', () => {
  it('reads JSON inside fences, after thinking, or with chatter around it', () => {
    expect(parseReply('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseReply('<think>hmm {no}</think>{"a":2}')).toEqual({ a: 2 });
    expect(parseReply('Sure! Here it is: {"a":3} Hope it helps.')).toEqual({
      a: 3,
    });
  });

  it('returns null for anything that is not one JSON object', () => {
    for (const text of ['', 'no json', '{"a":', '[1,2]']) {
      expect(parseReply(text)).toBeNull();
    }
  });
});

describe('conforms and tidy', () => {
  const good = {
    verdict: 'close',
    note: null,
    points: [{ text: 'next best alternative', weight: 1 }],
  };

  it('accepts a fitting reply and rejects a wrong enum or a stray key', () => {
    expect(conforms(good, schema)).toBe(true);
    expect(conforms({ ...good, verdict: 'perfect' }, schema)).toBe(false);
    expect(conforms({ ...good, extra: true }, schema)).toBe(false);
  });

  it('drops stray keys and fills missing nullable fields, but nothing else', () => {
    const nearMiss = {
      verdict: 'nailed',
      points: [{ text: 'x', weight: 2, why: 'stray' }],
      confidence: 0.9,
    };
    const tidied = tidy(nearMiss, schema);
    expect(tidied).toEqual({
      verdict: 'nailed',
      note: null,
      points: [{ text: 'x', weight: 2 }],
    });
    expect(conforms(tidied, schema)).toBe(true);
    // A missing required, non-nullable field stays missing.
    expect(conforms(tidy({ verdict: 'missed' }, schema), schema)).toBe(false);
  });
});
