import type { Lesson } from './lesson';
import type { Hue } from './scene';

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type ModuleId =
  | 'foundations'
  | 'scaling'
  | 'data'
  | 'communication'
  | 'reliability'
  | 'architecture'
  | 'security'
  | 'shipping'
  | 'case-studies';

export interface LessonMeta {
  /** kebab-case, unique; the route segment and the lesson file's name. */
  id: string;
  module: ModuleId;
  /** ≤ 32 chars. */
  title: string;
  /** ≤ 110 chars, shown under the title. */
  summary: string;
  level: Level;
  /** 5–15. */
  minutes: number;
  /** 3–10, for search. */
  keywords: readonly string[];
  /** false: not written yet; the sidebar says "soon" and `load` gives a stub. */
  ready: boolean;
  /** `() => import('./lessons/<module>/<id>').then((m) => m.lesson)` */
  load: () => Promise<Lesson>;
}

export interface CourseModule {
  id: ModuleId;
  /** 1-based. */
  number: number;
  title: string;
  hue: Hue;
  lessons: readonly LessonMeta[];
}
