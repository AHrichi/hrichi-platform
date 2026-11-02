import { loadBuiltInLessons } from './library';

describe('loadBuiltInLessons', () => {
  it('loads all seven built-in lessons, each valid', async () => {
    const lessons = await loadBuiltInLessons();
    expect(lessons.map((lesson) => lesson.id)).toEqual([
      'binary-search',
      'http-request',
      'event-loop',
      'recursion',
      'bfs',
      'lookups',
      'git-branching',
    ]);
  });
});
