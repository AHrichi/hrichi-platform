import { decodeHandoff, encodeHandoff, MAX_HANDOFF_ITEMS } from './handoff';
import { readTodaySummary } from './today-summary';

const source = {
  app: 'studylm',
  objectType: 'lesson',
  objectId: 'gen-js-event-loop',
  deepLink: 'https://example.com/apps/studylm/learn/gen-js-event-loop',
  excerpt: 'Microtasks run before the next task.',
};

describe('the hand-off', () => {
  it('round-trips captures with any text, including accents and emoji', () => {
    const items = [
      { text: 'Les micro-tâches passent avant la prochaine tâche ✓', source },
      { text: 'Without a source', source: null },
    ];
    const fragment = `#capture=${encodeHandoff(items)}`;
    expect(fragment).toMatch(/^#capture=[A-Za-z0-9_-]+$/);
    expect(decodeHandoff(fragment)).toEqual(items);
  });

  it('cuts to the limits and drops empty items', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      text: `idea ${i}`,
      source: null,
    }));
    const decoded = decodeHandoff(
      `capture=${encodeHandoff([{ text: '   ', source: null }, ...many])}`,
    );
    expect(decoded).toHaveLength(MAX_HANDOFF_ITEMS);
    expect(decoded?.[0].text).toBe('idea 0');
  });

  it('refuses anything else, and drops unsafe links', () => {
    expect(decodeHandoff('#trip=abc')).toBeNull();
    expect(decodeHandoff('#capture=%%%')).toBeNull();
    expect(decodeHandoff(`#capture=${btoa('{"items":"nope"}')}`)).toBeNull();
    const sneaky = decodeHandoff(
      `#capture=${encodeHandoff([{ text: 'x', source: { ...source, deepLink: 'javascript:alert(1)' } }])}`,
    );
    expect(sneaky?.[0].source?.deepLink).toBeNull();
    const noId = decodeHandoff(
      `#capture=${encodeHandoff([{ text: 'x', source: { ...source, objectId: '' } }])}`,
    );
    expect(noId?.[0].source).toBeNull();
  });
});

describe('the today summary', () => {
  it('reads a well-formed summary and ignores anything else', () => {
    const summary = {
      localDate: '2026-11-12',
      total: 7,
      done: 3,
      streak: 4,
      updatedAt: 'x',
    };
    expect(readTodaySummary(JSON.stringify(summary))).toEqual(summary);
    expect(readTodaySummary('{"total":"7"}')).toBeNull();
    expect(readTodaySummary('not json')).toBeNull();
    expect(readTodaySummary(null)).toBeNull();
  });
});
