import type { Lesson } from './spec/lesson';
import { validateLesson } from './validate/validate';

/**
 * The seven hand-written lessons, checked like any generated one. Loaded on
 * demand, so the JSON stays out of the screens that don't play lessons.
 */
export async function loadBuiltInLessons(): Promise<Lesson[]> {
  const { GOLDEN_LESSONS } = await import('../golden');
  return Object.values(GOLDEN_LESSONS).flatMap((data) => {
    const result = validateLesson(data);
    return result.ok ? [result.value] : [];
  });
}
