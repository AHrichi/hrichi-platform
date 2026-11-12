import 'fake-indexeddb/auto';
import { LearningDatabase, LearningLocalStore } from '@ah/learning/data-access';
import {
  GOLDEN_CONCEPTS,
  sampleConcept,
  sampleEvent,
} from '@ah/learning/domain';
import { demoDraftSource, openDemo, SAMPLE_MONTH_FLAG } from './demo';

const name = () => `demo-${Math.random()}`;

describe('the portfolio copy', () => {
  it('starts empty', async () => {
    const local = await openDemo(name());
    expect(await local.concepts()).toEqual([]);
    expect(await local.events()).toEqual([]);
    expect(await local.sessions()).toEqual([]);
  });

  it('wipes the old sample month, once, and keeps anything newer', async () => {
    const db = name();
    const oldDatabase = new LearningDatabase(db);
    const old = new LearningLocalStore(oldDatabase);
    await old.saveConcept(sampleConcept());
    await old.appendEvent(sampleEvent());
    await old.setMeta(SAMPLE_MONTH_FLAG, true);
    oldDatabase.close();

    const fresh = await openDemo(db);
    expect(await fresh.concepts()).toEqual([]);
    expect(await fresh.events()).toEqual([]);
    expect(await fresh.getMeta(SAMPLE_MONTH_FLAG)).toBeNull();

    // What the visitor adds afterwards stays.
    await fresh.saveConcept(sampleConcept());
    expect(await (await openDemo(db)).concepts()).toHaveLength(1);
  });

  it('turns captures into each ready-made concept in turn', () => {
    const titles = GOLDEN_CONCEPTS.map((_, i) => demoDraftSource(i).title);
    expect(new Set(titles).size).toBe(GOLDEN_CONCEPTS.length);
    expect(demoDraftSource(GOLDEN_CONCEPTS.length).title).toBe(titles[0]);
  });
});
