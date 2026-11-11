import * as v from 'valibot';
import { type Concept, ConceptLinkSchema } from '../records';
import { composeDailySet, pickContrast } from '../schedule/composer';
import type { MemoryState } from '../schedule/memory';
import { emptyPush, SyncRequestSchema } from '../sync';
import { sampleConcept, sampleTeachBack } from '../testing/fixtures';
import type { Answer } from './decisions';
import {
  describeLink,
  linkCandidates,
  linkQuestions,
  linkRecord,
  readLinks,
} from './links';

const id = (n: number) =>
  `0b6f0c30-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`;

function concept(n: number, title: string, essence: string): Concept {
  return sampleConcept({
    id: id(n),
    title,
    explanation: { ...sampleConcept().explanation, essence },
    prompts: [
      {
        ...sampleConcept().prompts[0],
        id: id(50 + n),
        keyPoints: [],
      },
    ],
  });
}

const osmosis = concept(
  1,
  'Osmosis',
  'Water moves across a membrane toward the higher solute concentration.',
);
const diffusion = concept(
  2,
  'Diffusion',
  'Particles spread from higher to lower concentration until even.',
);
const inflation = concept(
  3,
  'Inflation',
  'Prices rise over time, so money buys less.',
);
const membrane = concept(
  4,
  'Cell membrane',
  'A thin layer around a cell that lets some things through.',
);

const choice = (value: string, confidence = 0.9): Answer => ({
  type: 'choice',
  choice: value,
  confidence,
  probabilities: { [value]: confidence },
});

const reviewed = (conceptId: string): MemoryState => ({
  conceptId,
  phase: 'review',
  stability: 10,
  difficulty: 5,
  dueAt: '2026-11-12T08:00:00.000Z',
  lastReviewAt: '2026-11-01T08:00:00.000Z',
  reps: 3,
  lapses: 0,
  promptUses: {},
  lastPromptId: null,
});

describe('concept links', () => {
  it('shortlists concepts that share words, closest first', () => {
    expect(
      linkCandidates(osmosis, [inflation, diffusion, membrane, osmosis]).map(
        (c) => c.title,
      ),
    ).toEqual(['Diffusion', 'Cell membrane']);
  });

  it('asks one relation question per candidate', () => {
    const questions = linkQuestions(osmosis, [diffusion, membrane]);
    expect(Object.keys(questions)).toEqual(['link0', 'link1']);
    expect(questions['link0']).toMatchObject({
      type: 'choice',
      criteria: expect.objectContaining({ none: expect.any(String) }),
    });
  });

  it('keeps confident relations only, never "none"', () => {
    const suggestions = readLinks(
      {
        link0: choice('similar'),
        link1: choice('none'),
        link2: choice('causes', 0.4),
      },
      [diffusion, membrane, inflation],
    );
    expect(suggestions).toEqual([
      { to: diffusion.id, relation: 'similar', confidence: 0.9 },
    ]);
  });

  it('confirms the learner’s own links and refuses a link to itself', () => {
    const now = new Date('2026-11-12T08:00:00Z');
    const mine = linkRecord({
      from: osmosis.id,
      to: diffusion.id,
      relation: 'contrasts',
      by: 'user',
      now,
    });
    expect(mine.confirmed).toBe(true);
    expect(v.safeParse(ConceptLinkSchema, mine).success).toBe(true);
    expect(
      v.safeParse(ConceptLinkSchema, { ...mine, to: osmosis.id }).success,
    ).toBe(false);
    const ai = linkRecord({ ...mine, by: 'ai', now });
    expect(ai.confirmed).toBe(false);
    const { links, ...older } = emptyPush();
    expect(links).toEqual([]);
    expect(
      v.parse(SyncRequestSchema, { cursor: 0, push: older }).push.links,
    ).toEqual([]);
  });

  it('reads a link from either end', () => {
    expect(describeLink('example_of', 'Osmosis', 'Diffusion')).toBe(
      '“Osmosis” is an example of “Diffusion”',
    );
  });
});

describe('the contrast card', () => {
  const link = linkRecord({
    from: osmosis.id,
    to: diffusion.id,
    relation: 'similar',
    by: 'user',
    now: new Date('2026-11-01T08:00:00Z'),
  });
  const planned = [inflation, osmosis, membrane].map((c) => ({
    conceptId: c.id,
    promptId: c.prompts[0].id,
  }));
  const memory = new Map(
    [osmosis, diffusion, inflation, membrane].map((c) => [
      c.id,
      reviewed(c.id),
    ]),
  );
  const concepts = [osmosis, diffusion, inflation, membrane];

  it('compares a planned concept with a reviewed linked one', () => {
    expect(pickContrast(planned, { memory, links: [link], concepts })).toEqual({
      index: 1,
      with: diffusion.id,
    });
  });

  it('needs a confirmed link, of a comparable kind, to a reviewed concept', () => {
    const unconfirmed = { ...link, confirmed: false };
    const causes = { ...link, relation: 'causes' as const };
    for (const links of [[unconfirmed], [causes]]) {
      expect(pickContrast(planned, { memory, links, concepts })).toBeNull();
    }
    const fresh = new Map(memory);
    fresh.delete(diffusion.id);
    expect(
      pickContrast(planned, { memory: fresh, links: [link], concepts }),
    ).toBeNull();
  });

  it('skips the opener and the teach-back card', () => {
    const first = [planned[1], planned[0]];
    expect(pickContrast(first, { memory, links: [link], concepts })).toBeNull();
    const teach = [planned[0], { ...planned[1], teach: true }];
    expect(pickContrast(teach, { memory, links: [link], concepts })).toBeNull();
  });

  it('marks one card of a composed set', () => {
    // Inflation, reviewed last, opens; no teach-back is due this week.
    const recent = new Map(memory);
    recent.set(inflation.id, {
      ...reviewed(inflation.id),
      lastReviewAt: '2026-11-11T08:00:00.000Z',
    });
    const { planned: set } = composeDailySet({
      concepts,
      memory: recent,
      sessions: [],
      events: [],
      localDate: '2026-11-12',
      now: new Date('2026-11-12T09:00:00Z'),
      timeZone: 'UTC',
      links: [link],
      teachBacks: concepts.map((c, i) =>
        sampleTeachBack({
          id: id(80 + i),
          conceptId: c.id,
          localDate: '2026-11-11',
        }),
      ),
    });
    expect(set[0].conceptId).toBe(inflation.id);
    expect(set.filter((item) => item.contrastWith)).toHaveLength(1);
  });
});
