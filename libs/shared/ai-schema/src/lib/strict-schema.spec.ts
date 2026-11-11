import * as v from 'valibot';
import { strictJsonSchema, strictnessProblems } from './strict-schema';

describe('strictJsonSchema', () => {
  const Verdict = v.strictObject({
    verdict: v.picklist(['nailed', 'close', 'missed']),
    missed: v.pipe(
      v.array(v.pipe(v.string(), v.maxLength(120))),
      v.maxLength(3),
      v.description('At most 3 key points the answer left out.'),
    ),
    note: v.nullable(v.string()),
    detail: v.union([
      v.strictObject({ kind: v.literal('text'), text: v.string() }),
      v.strictObject({ kind: v.literal('score'), score: v.number() }),
    ]),
  });

  it('requires every key and closes every object', () => {
    const schema = strictJsonSchema(Verdict);
    expect(schema['required']).toEqual(['verdict', 'missed', 'note', 'detail']);
    expect(schema['additionalProperties']).toBe(false);
    expect(strictnessProblems(schema)).toEqual([]);
  });

  it('writes unions as anyOf and drops size keywords, keeping descriptions', () => {
    const text = JSON.stringify(strictJsonSchema(Verdict));
    expect(text).toContain('"anyOf"');
    expect(text).toContain('At most 3 key points');
    expect(text).not.toMatch(/"(oneOf|\$schema|maxLength|maxItems)"/);
  });

  it('flags objects nested deeper than a strict mode allows', () => {
    let deep: v.GenericSchema = v.strictObject({ leaf: v.string() });
    for (let i = 0; i < 5; i++) deep = v.strictObject({ child: deep });
    expect(strictnessProblems(strictJsonSchema(deep))).toEqual([
      '/child/child/child/child/child: objects nest 6 deep (at most 5)',
    ]);
  });
});

describe('strictnessProblems', () => {
  it('spots what a strict mode would refuse', () => {
    expect(
      strictnessProblems({
        type: 'object',
        properties: {
          a: { type: 'string', maxLength: 3 },
          b: { type: 'number' },
        },
        required: ['a'],
      }),
    ).toEqual([
      ': additionalProperties must be false',
      '/a: keyword "maxLength" is not allowed',
      ': "b" is not required',
    ]);
  });
});
