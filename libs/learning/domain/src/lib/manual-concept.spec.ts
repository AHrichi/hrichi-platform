import * as v from 'valibot';
import { conceptFromDraft } from './manual-concept';
import { ConceptSchema } from './records';

describe('conceptFromDraft', () => {
  it('builds a valid, kept concept with one free-recall prompt', () => {
    let n = 0;
    const ids = () => `0b6f0c30-0000-4000-8000-00000000010${n++}`;
    const concept = conceptFromDraft(
      {
        title: '  Spaced repetition ',
        essence: 'Review just before you would forget.',
        question: 'Why space reviews out?',
        answer:
          'Each effortful recall near forgetting strengthens memory most.',
      },
      new Date('2026-11-11T09:00:00Z'),
      ids,
    );

    expect(v.safeParse(ConceptSchema, concept).success).toBe(true);
    expect(concept.title).toBe('Spaced repetition');
    expect(concept.status).toBe('active');
    expect(concept.confirmedAt).toBe('2026-11-11T09:00:00.000Z');
    expect(concept.prompts).toEqual([
      expect.objectContaining({
        id: '0b6f0c30-0000-4000-8000-000000000101',
        type: 'free_recall',
      }),
    ]);
  });
});
