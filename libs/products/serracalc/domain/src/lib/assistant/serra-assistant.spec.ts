import { compileProfile, portabilityProblems } from '@ah/shared/assistant';
import { describe, expect, it } from 'vitest';
import { CALC_KINDS, OPENS_IN, SERRA_SCREENS } from './navigation';
import { SERRA_ASSISTANT, SITE_WIDE_TOOLS } from './serra-assistant';

describe('SerraCalc’s assistant profile', () => {
  const compiled = compileProfile(SERRA_ASSISTANT);

  it('has tools every provider accepts', () => {
    expect(compiled.specs.flatMap(portabilityProblems)).toEqual([]);
  });

  it('keeps its tools small: they go with every request', () => {
    // About 2,000 tokens: with the prompt and a conversation, a round
    // stays near 3,000, inside the free tiers' per-minute budgets.
    expect(JSON.stringify(compiled.specs).length).toBeLessThan(7000);
    expect(SERRA_ASSISTANT.system('en').length).toBeLessThan(2400);
  });

  it('asks the user before anything that changes or deletes data', () => {
    const effects = Object.fromEntries(
      SERRA_ASSISTANT.tools.map((tool) => [tool.name, tool.effect]),
    );
    expect(effects).toMatchObject({
      create_project: 'write',
      update_project: 'write',
      save_calculation: 'write',
      rename_result: 'write',
      delete_project: 'destructive',
      delete_result: 'destructive',
    });
    for (const name of SITE_WIDE_TOOLS) expect(effects[name]).toBe('setting');
  });

  it('opens every kind of result on a real screen', () => {
    expect(CALC_KINDS).toHaveLength(20);
    for (const kind of CALC_KINDS) {
      expect(SERRA_SCREENS).toContain(OPENS_IN[kind].screen);
    }
  });

  it('answers in the reader’s language', () => {
    expect(SERRA_ASSISTANT.system('ar')).toContain('Answer in Arabic');
    expect(SERRA_ASSISTANT.system('de')).toContain('Answer in German');
  });
});
