import { validateLesson } from '../validate/lesson';
import { ALL_LESSONS, CURRICULUM, findLesson, ready } from './curriculum';
import { pendingLesson } from './lessons/pending';

describe('curriculum', () => {
  it('has 9 modules numbered in order and 44 lessons', () => {
    expect(CURRICULUM.map((m) => m.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(ALL_LESSONS).toHaveLength(44);
  });

  it('uses each lesson id once, and files each lesson under its module', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of CURRICULUM)
      for (const l of m.lessons) expect(l.module).toBe(m.id);
  });

  it('finds lessons by id', () => {
    expect(findLesson('caching')?.title).toBe('Caching');
    expect(findLesson('nope')).toBeUndefined();
  });

  it('marks a lesson ready with its own loader', async () => {
    const lesson = pendingLesson('x-lesson', 'X');
    const meta = ready(
      'scaling',
      ['x-lesson', 'X', 'beginner', 9, 'S', ['a', 'b', 'c']],
      () => Promise.resolve(lesson),
    );
    expect(meta.ready).toBe(true);
    expect(await meta.load()).toBe(lesson);
  });
});

// Every lesson, written or still a stand-in, must pass every rule: this is the
// gate a content agent's lesson goes through (lesson-authoring.md §9).
describe.each(ALL_LESSONS.map((m) => [m.id, m] as const))(
  'lesson %s',
  (_, meta) => {
    it('passes validateLesson', async () => {
      const lesson = await meta.load();
      expect(validateLesson(meta, lesson)).toEqual([]);
    });
  },
);
