import { BLOCK_KINDS, BLOCK_SCHEMAS } from '../spec/blocks';
import {
  LessonOutlineSchema,
  LessonSchema,
  SelfExplainFeedbackSchema,
} from '../spec/lesson';
import { strictJsonSchema, strictnessProblems } from './strict-schema';

describe('Strict JSON Schemas', () => {
  it.each(BLOCK_KINDS)('the "%s" block fits every strict mode', (kind) => {
    const schema = strictJsonSchema(BLOCK_SCHEMAS[kind]);
    expect(strictnessProblems(schema)).toEqual([]);
    expect(schema['properties']).toHaveProperty('kind', { const: kind });
  });

  it('the outline, the feedback and the whole lesson fit too', () => {
    for (const schema of [
      LessonOutlineSchema,
      SelfExplainFeedbackSchema,
      LessonSchema,
    ]) {
      expect(strictnessProblems(strictJsonSchema(schema))).toEqual([]);
    }
  });

  it('writes unions as anyOf, with no oneOf, $schema or size keywords', () => {
    const text = JSON.stringify(strictJsonSchema(LessonSchema));
    expect(text).toContain('"anyOf"');
    expect(text).not.toMatch(
      /"(oneOf|\$schema|pattern|maxLength|maxItems|minimum)"/,
    );
  });

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
