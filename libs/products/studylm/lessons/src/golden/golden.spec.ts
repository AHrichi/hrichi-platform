import { BLOCK_KINDS } from '../lib/spec/blocks';
import type { Lesson } from '../lib/spec/lesson';
import { validateLesson } from '../lib/validate/validate';
import { GOLDEN_LESSONS } from '.';

describe('Golden lessons', () => {
  it.each(Object.keys(GOLDEN_LESSONS))(
    '"%s" passes every check, with no warnings',
    (name) => {
      const result = validateLesson(GOLDEN_LESSONS[name]);
      expect(result.ok ? result.warnings : result.issues).toEqual([]);
      expect(result.ok).toBe(true);
    },
  );

  it('use every block kind in the catalog', () => {
    const used = new Set(
      (Object.values(GOLDEN_LESSONS) as Lesson[]).flatMap((lesson) =>
        lesson.sections.flatMap((section) =>
          section.blocks.map((block) => block.kind),
        ),
      ),
    );
    expect(BLOCK_KINDS.filter((kind) => !used.has(kind))).toEqual([]);
  });
});
