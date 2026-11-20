import { validateLesson } from '../validate/lesson';
import {
  CHEATSHEETS,
  CHEAT_TERMS,
  cheatTermsFrom,
  findCheatsheet,
} from './cheatsheets';
import { ALL_LESSONS, CURRICULUM, findLesson, ready } from './curriculum';
import { pendingLesson } from './lessons/pending';

describe('curriculum', () => {
  it('has 9 modules numbered in order and 44 lessons', () => {
    expect(CURRICULUM.map((m) => m.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(ALL_LESSONS).toHaveLength(44);
  });

  it('marks the 4 Foundations lessons as ready', () => {
    const foundations = CURRICULUM[0];
    expect(foundations.id).toBe('foundations');
    expect(foundations.lessons.map((l) => [l.id, l.ready])).toEqual([
      ['request-journey', true],
      ['latency-throughput', true],
      ['napkin-math', true],
      ['availability', true],
    ]);
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

describe('cheatsheets', () => {
  it('has exactly one ready sheet per module, in course order', () => {
    expect(CHEATSHEETS.map((c) => c.module)).toEqual(
      CURRICULUM.map((m) => m.id),
    );
    expect(CHEATSHEETS.every((c) => c.ready)).toBe(true);
    expect(findCheatsheet('data')?.title).toBe('Data & Storage Cheatsheet');
  });

  it('keeps CHEAT_TERMS in step with the sheets (regenerate with tools/scripts/system-design-cheat-terms.mjs)', async () => {
    const sheets = await Promise.all(CHEATSHEETS.map((c) => c.load()));
    expect(CHEAT_TERMS).toEqual(sheets.flatMap(cheatTermsFrom));
  });
});

describe.each(CHEATSHEETS.map((c) => [c.module, c] as const))(
  'cheatsheet %s',
  (module, meta) => {
    it('loads a sheet for its own module with at least 3 sections', async () => {
      const sheet = await meta.load();
      expect(sheet.module).toBe(module);
      expect(sheet.intro.length).toBeGreaterThan(20);
      expect(sheet.sections.length).toBeGreaterThanOrEqual(3);
      const titles = sheet.sections.map((s) => s.title);
      expect(new Set(titles).size).toBe(titles.length);
    });

    it('fills every table row and list to shape', async () => {
      const sheet = await meta.load();
      for (const section of sheet.sections) {
        if (section.kind === 'table') {
          expect(section.rows.length).toBeGreaterThan(0);
          for (const row of section.rows)
            expect(row, section.title).toHaveLength(section.columns.length);
        }
        if (section.kind === 'numbers')
          for (const row of section.rows)
            expect(row[0] && row[1], section.title).toBeTruthy();
        if (section.kind === 'list')
          expect(section.items.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('links every pattern to a real lesson in this module', async () => {
      const sheet = await meta.load();
      const patterns = sheet.sections.filter((s) => s.kind === 'pattern');
      expect(patterns.length).toBeGreaterThanOrEqual(2);
      for (const p of patterns) {
        const lesson = p.lesson ? findLesson(p.lesson) : undefined;
        expect(lesson, `${p.title} → ${p.lesson}`).toBeDefined();
        expect(lesson?.module).toBe(module);
      }
    });
  },
);

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
