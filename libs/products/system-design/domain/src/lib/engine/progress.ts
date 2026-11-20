import type { CourseModule, LessonMeta, ModuleId } from '../model/course';

/** What the app remembers about one lesson (one Dexie row in P5). */
export interface LessonProgress {
  lessonId: string;
  /** Furthest 0-based step shown. */
  furthestStep: number;
  /** Last 0-based step shown, where the learner resumes. */
  lastStep: number;
  /** ISO time the recap was first shown, else null. */
  completedAt: string | null;
  /** ISO time of the last visit. */
  updatedAt: string;
}

export type LessonStatus = 'new' | 'started' | 'complete';

/** Complete once the recap has been shown; started once past step 1. */
export function lessonStatus(p: LessonProgress | undefined): LessonStatus {
  if (!p) return 'new';
  if (p.completedAt) return 'complete';
  return p.furthestStep > 0 ? 'started' : 'new';
}

/** What a visit to step `step` of a lesson with `stepCount` steps records. */
export function recordVisit(
  prev: LessonProgress | undefined,
  lessonId: string,
  step: number,
  stepCount: number,
  now: string,
): LessonProgress {
  const furthest = Math.max(prev?.furthestStep ?? 0, step);
  return {
    lessonId,
    furthestStep: furthest,
    lastStep: step,
    completedAt: prev?.completedAt ?? (step >= stepCount - 1 ? now : null),
    updatedAt: now,
  };
}

export interface ModuleCount {
  id: ModuleId;
  done: number;
  total: number;
}

export interface CourseProgress {
  done: number;
  total: number;
  modules: ModuleCount[];
}

export type ProgressMap = ReadonlyMap<string, LessonProgress>;

export function courseProgress(
  modules: readonly CourseModule[],
  progress: ProgressMap,
): CourseProgress {
  const counts = modules.map((m) => ({
    id: m.id,
    done: m.lessons.filter(
      (l) => lessonStatus(progress.get(l.id)) === 'complete',
    ).length,
    total: m.lessons.length,
  }));
  return {
    done: counts.reduce((s, c) => s + c.done, 0),
    total: counts.reduce((s, c) => s + c.total, 0),
    modules: counts,
  };
}

/**
 * Where `/learn` goes: the most recently visited unfinished lesson, else the
 * first ready lesson not yet complete, else the first lesson.
 */
export function nextLesson(
  modules: readonly CourseModule[],
  progress: ProgressMap,
): LessonMeta | null {
  const all = modules.flatMap((m) => m.lessons);
  if (all.length === 0) return null;
  const open = all
    .map((l) => ({ l, p: progress.get(l.id) }))
    .filter(({ p }) => p && !p.completedAt)
    .sort((a, b) => (b.p?.updatedAt ?? '').localeCompare(a.p?.updatedAt ?? ''));
  if (open.length) return open[0].l;
  return (
    all.find(
      (l) => l.ready && lessonStatus(progress.get(l.id)) !== 'complete',
    ) ?? all[0]
  );
}

/** Lessons in course order with their place: "Lesson 2 of 4". */
export function lessonPlace(
  modules: readonly CourseModule[],
  lessonId: string,
): {
  module: CourseModule;
  index: number;
  prev: LessonMeta | null;
  next: LessonMeta | null;
} | null {
  const all = modules.flatMap((m) => m.lessons);
  const at = all.findIndex((l) => l.id === lessonId);
  if (at < 0) return null;
  const meta = all[at];
  const module = modules.find((m) => m.id === meta.module);
  if (!module) return null;
  return {
    module,
    index: module.lessons.findIndex((l) => l.id === lessonId),
    prev: all[at - 1] ?? null,
    next: all[at + 1] ?? null,
  };
}
