import { computed, DestroyRef, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { AttemptRow } from '@ah/products/system-design/data-access';
import {
  type CheckResponse,
  type CourseModule,
  courseProgress,
  CURRICULUM,
  findLesson,
  type Lesson,
  lessonPlace,
  type LessonProgress,
  lessonStatus,
  type LessonStatus,
  nextLesson,
  recordVisit,
} from '@ah/products/system-design/domain';
import { SystemDesignRuntime } from './system-design-runtime';

/** Debounce interval for IndexedDB progress persistence (technical-design §5). */
export const VISIT_DEBOUNCE_MS = 300;

export interface SystemDesignState {
  ready: boolean;
  fatal: string | null;
  curriculum: readonly CourseModule[];
  progressById: Readonly<Record<string, LessonProgress>>;
  attempts: readonly AttemptRow[];
  activeLessonId: string | null;
  /** 0-based active step index. */
  activeStepIndex: number;
  activeLesson: Lesson | null;
  loadingLesson: boolean;
  searchOpen: boolean;
  drawerOpen: boolean;
}

const initialState: SystemDesignState = {
  ready: false,
  fatal: null,
  curriculum: CURRICULUM,
  progressById: {},
  attempts: [],
  activeLessonId: null,
  activeStepIndex: 0,
  activeLesson: null,
  loadingLesson: false,
  searchOpen: false,
  drawerOpen: false,
};

export const SystemDesignStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ curriculum, progressById, activeLessonId }) => {
    const progressMap = computed<ReadonlyMap<string, LessonProgress>>(
      () => new Map(Object.entries(progressById())),
    );
    return {
      progressMap,
      courseProgress: computed(() =>
        courseProgress(curriculum(), progressMap()),
      ),
      recommendedLesson: computed(() =>
        nextLesson(curriculum(), progressMap()),
      ),
      activeMeta: computed(() => {
        const id = activeLessonId();
        return id ? (findLesson(id) ?? null) : null;
      }),
      activePlace: computed(() => {
        const id = activeLessonId();
        return id ? lessonPlace(curriculum(), id) : null;
      }),
      lessonStatuses: computed<Readonly<Record<string, LessonStatus>>>(() => {
        const map = progressMap();
        const out: Record<string, LessonStatus> = {};
        for (const mod of curriculum()) {
          for (const lesson of mod.lessons) {
            out[lesson.id] = lessonStatus(map.get(lesson.id));
          }
        }
        return out;
      }),
    };
  }),
  withMethods((store) => {
    const runtime = inject(SystemDesignRuntime);
    const destroyRef = inject(DestroyRef, { optional: true });
    const lessonCache = new Map<string, Lesson>();
    let visitTimer: ReturnType<typeof setTimeout> | null = null;
    let loadPromise: Promise<void> | null = null;

    destroyRef?.onDestroy(() => {
      if (visitTimer !== null) {
        clearTimeout(visitTimer);
        visitTimer = null;
      }
    });

    async function persistProgress(row: LessonProgress): Promise<void> {
      try {
        const local = await runtime.open();
        if (!local) return;
        await local.putProgress(row);
        await local.setMeta('lastLesson', row.lessonId);
      } catch {
        // Ignore storage write errors in private/restricted contexts.
      }
    }

    function applyVisitInMemory(
      lessonId: string,
      stepIndex: number,
      stepCount?: number,
      nowIso = new Date().toISOString(),
    ): LessonProgress {
      const total =
        stepCount ??
        (store.activeLesson()?.id === lessonId
          ? store.activeLesson()!.steps.length
          : (lessonCache.get(lessonId)?.steps.length ?? 6));
      const clamped = Math.max(0, Math.min(stepIndex, Math.max(0, total - 1)));
      const prev = store.progressById()[lessonId];
      const next = recordVisit(prev, lessonId, clamped, total, nowIso);
      patchState(store, {
        progressById: { ...store.progressById(), [lessonId]: next },
        ...(store.activeLessonId() === lessonId
          ? { activeStepIndex: clamped }
          : {}),
      });
      return next;
    }

    return {
      load(): Promise<void> {
        loadPromise ??= (async () => {
          try {
            const local = await runtime.open();
            if (!local) {
              patchState(store, { ready: true });
              return;
            }
            const [rows, attempts] = await Promise.all([
              local.allProgress(),
              local.allAttempts(),
            ]);
            const byId: Record<string, LessonProgress> = {};
            for (const row of rows) {
              byId[row.lessonId] = row;
            }
            patchState(store, {
              progressById: byId,
              attempts,
              ready: true,
              fatal: null,
            });
          } catch (err) {
            patchState(store, {
              ready: true,
              fatal:
                err instanceof Error
                  ? err.message
                  : 'Could not open local System Design database.',
            });
          }
        })();
        return loadPromise;
      },

      async visit(
        lessonId: string,
        stepIndex: number,
        stepCount?: number,
        nowIso = new Date().toISOString(),
      ): Promise<LessonProgress> {
        if (visitTimer !== null) {
          clearTimeout(visitTimer);
          visitTimer = null;
        }
        const next = applyVisitInMemory(lessonId, stepIndex, stepCount, nowIso);
        await persistProgress(next);
        return next;
      },

      visitDebounced(
        lessonId: string,
        stepIndex: number,
        stepCount?: number,
      ): LessonProgress {
        const next = applyVisitInMemory(lessonId, stepIndex, stepCount);
        if (visitTimer !== null) {
          clearTimeout(visitTimer);
        }
        visitTimer = setTimeout(() => {
          visitTimer = null;
          void persistProgress(next);
        }, VISIT_DEBOUNCE_MS);
        return next;
      },

      async openLesson(
        lessonId: string,
        requestedStepIndex?: number,
      ): Promise<Lesson | null> {
        await this.load();
        const meta = findLesson(lessonId);
        if (!meta) return null;

        let lesson = lessonCache.get(lessonId) ?? null;
        if (!lesson) {
          patchState(store, { loadingLesson: true });
          lesson = await meta.load();
          lessonCache.set(lessonId, lesson);
        }

        const savedStep = store.progressById()[lessonId]?.lastStep ?? 0;
        const target =
          requestedStepIndex !== undefined &&
          Number.isFinite(requestedStepIndex)
            ? requestedStepIndex
            : savedStep;
        const clamped = Math.max(
          0,
          Math.min(target, Math.max(0, lesson.steps.length - 1)),
        );

        patchState(store, {
          activeLessonId: lessonId,
          activeLesson: lesson,
          activeStepIndex: clamped,
          loadingLesson: false,
        });

        this.visitDebounced(lessonId, clamped, lesson.steps.length);
        return lesson;
      },

      async recordAttempt(
        lessonId: string,
        checkId: string,
        answer: CheckResponse,
        correct: boolean,
        at = new Date().toISOString(),
      ): Promise<AttemptRow> {
        const entry: AttemptRow = { lessonId, checkId, answer, correct, at };
        try {
          const local = await runtime.open();
          if (local) {
            const id = await local.addAttempt(entry);
            entry.id = id;
          }
        } catch {
          // Keep in-memory state even if IndexedDB is unavailable.
        }
        patchState(store, {
          attempts: [...store.attempts(), entry],
        });
        return entry;
      },

      openSearch(): void {
        patchState(store, { searchOpen: true });
      },

      closeSearch(): void {
        patchState(store, { searchOpen: false });
      },

      toggleSearch(): void {
        patchState(store, { searchOpen: !store.searchOpen() });
      },

      openDrawer(): void {
        patchState(store, { drawerOpen: true });
      },

      closeDrawer(): void {
        patchState(store, { drawerOpen: false });
      },

      toggleDrawer(): void {
        patchState(store, { drawerOpen: !store.drawerOpen() });
      },
    };
  }),
  withHooks({
    onInit(store) {
      void store.load();
    },
  }),
);
