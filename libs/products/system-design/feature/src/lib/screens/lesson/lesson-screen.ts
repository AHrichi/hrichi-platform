import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LearnThis } from '@ah/learning/client';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  CURRICULUM,
  findLesson,
  sceneAt,
  type SceneState,
} from '@ah/products/system-design/domain';
import {
  SdHud,
  SdIcon,
  SdIsoScene,
  SdLearnList,
  SdLegend,
  SdStepPanel,
  SdTimeline,
} from '@ah/products/system-design/ui';
import { isAppEnabled } from '@ah/shared/content';
import { injectReducedMotion, realClock, StepTimeline } from '@ah/ui';
import { LEARNING_COPY } from '../../copy/learning-copy';
import { handleSystemDesignKey } from '../../keyboard/keyboard';
import { lessonReviewItems } from '../../learning/review-items';
import { SdNav } from '../../services/sd-nav';
import { SystemDesignStore } from '../../store/system-design.store';

/**
 * Main lesson player screen (`sd-lesson-screen`).
 *
 * - Drives step index through `StepTimeline` from `@ah/ui` (`0-based` internally,
 *   `1-based` in the URL `learn/:lessonId/:step`).
 * - Memoises `sceneAt(lesson, index)` per step index for the active lesson.
 * - Handles keyboard navigation (`←`, `→`, `Home`, `End`, `R`, `Space`).
 */
@Component({
  selector: 'sd-lesson-screen',
  imports: [
    LearnThis,
    SdHud,
    SdIcon,
    SdIsoScene,
    SdLearnList,
    SdLegend,
    SdStepPanel,
    SdTimeline,
  ],
  templateUrl: './lesson-screen.html',
  styleUrl: './lesson-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onDocumentKey($event)',
  },
})
export class LessonScreen {
  protected readonly store = inject(SystemDesignStore);
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  /** The Learning Engine hand-off shows standalone, or when the engine is public. */
  protected readonly learningOn = this.standalone || isAppEnabled('learning');
  protected readonly learningCopy = LEARNING_COPY;
  protected readonly reducedMotion = injectReducedMotion();
  protected readonly timeline = new StepTimeline(realClock, { stepMs: 3600 });
  protected readonly packetPlaying = signal(true);
  protected readonly stageFullscreen = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(SdNav);
  private readonly paramMap = toSignal(this.route.paramMap);
  private readonly isoScene = viewChild<SdIsoScene>('isoScene');

  private cachedLessonId: string | null = null;
  private readonly sceneCache = new Map<number, SceneState>();
  private syncedLessonId: string | null = null;

  protected readonly stepIndex = computed(() =>
    Math.max(0, this.timeline.index()),
  );

  protected readonly currentStep = computed(() => {
    const lesson = this.store.activeLesson();
    if (!lesson) return null;
    return lesson.steps[this.stepIndex()] ?? lesson.steps[0] ?? null;
  });

  /** The lesson's review cards, offered on the recap step only. */
  protected readonly reviewItems = computed(() => {
    const lesson = this.store.activeLesson();
    const meta = this.store.activeMeta();
    if (!lesson || !meta || this.currentStep()?.kind !== 'recap') return [];
    return lessonReviewItems(lesson, meta);
  });

  protected readonly nextStepLabel = computed(() => {
    const lesson = this.store.activeLesson();
    if (!lesson) return null;
    const next = lesson.steps[this.stepIndex() + 1];
    return next ? next.label : null;
  });

  protected readonly furthestStep = computed(() => {
    const id = this.store.activeLessonId();
    if (!id) return this.stepIndex();
    const saved = this.store.progressById()[id]?.furthestStep ?? 0;
    return Math.max(saved, this.stepIndex());
  });

  protected readonly breadcrumb = computed(() => {
    const place = this.store.activePlace();
    if (!place) return null;
    const modNum = String(place.module.number).padStart(2, '0');
    return `${modNum}. ${place.module.title} / Lesson ${place.index + 1} of ${place.module.lessons.length}`;
  });

  /** Memoised `sceneAt(lesson, stepIndex)` per step index. */
  protected readonly sceneState = computed<SceneState | null>(() => {
    const lesson = this.store.activeLesson();
    if (!lesson) return null;
    const idx = this.stepIndex();
    if (this.cachedLessonId !== lesson.id) {
      this.sceneCache.clear();
      this.cachedLessonId = lesson.id;
    }
    let state = this.sceneCache.get(idx);
    if (!state) {
      state = sceneAt(lesson, idx);
      this.sceneCache.set(idx, state);
    }
    return state;
  });

  constructor() {
    effect(() => {
      const params = this.paramMap();
      if (!params) return;
      const lessonId = params.get('lessonId');
      const stepParam = params.get('step');
      void untracked(() => this.syncFromRoute(lessonId, stepParam));
    });
  }

  protected goToStepIndex(index: number): void {
    const lesson = this.store.activeLesson();
    if (!lesson) return;
    const clamped = Math.max(0, Math.min(index, lesson.steps.length - 1));
    this.timeline.seek(clamped);
    this.packetPlaying.set(true);
    this.store.visitDebounced(lesson.id, clamped, lesson.steps.length);
    void this.nav.goToLesson(lesson.id, clamped + 1);
  }

  protected stepForward(): void {
    const lesson = this.store.activeLesson();
    if (!lesson) return;
    const next = this.stepIndex() + 1;
    if (next < lesson.steps.length) {
      this.goToStepIndex(next);
    }
  }

  protected stepBack(): void {
    const prev = this.stepIndex() - 1;
    if (prev >= 0) {
      this.goToStepIndex(prev);
    }
  }

  protected stepFirst(): void {
    this.goToStepIndex(0);
  }

  protected stepLast(): void {
    const lesson = this.store.activeLesson();
    if (!lesson) return;
    this.goToStepIndex(lesson.steps.length - 1);
  }

  protected replayPackets(): void {
    this.packetPlaying.set(true);
    this.isoScene()?.replay();
  }

  protected togglePackets(): void {
    this.packetPlaying.update((v) => !v);
  }

  protected toggleFullscreen(): void {
    this.stageFullscreen.update((v) => !v);
  }

  protected openPractice(): void {
    const id = this.store.activeLessonId();
    void this.nav.goToPractice(id ?? undefined);
  }

  protected openNextLesson(): void {
    const next = this.store.activePlace()?.next;
    if (next) {
      void this.nav.goToLesson(next.id, 1);
    }
  }

  protected onDocumentKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.stageFullscreen()) {
      event.preventDefault();
      this.stageFullscreen.set(false);
      return;
    }

    handleSystemDesignKey(event, {
      overlayOpen: () =>
        this.store.searchOpen() ||
        this.store.drawerOpen() ||
        this.stageFullscreen(),
      nextStep: () => this.stepForward(),
      prevStep: () => this.stepBack(),
      firstStep: () => this.stepFirst(),
      lastStep: () => this.stepLast(),
      replay: () => this.replayPackets(),
      togglePlay: () => this.togglePackets(),
    });
  }

  private async syncFromRoute(
    lessonId: string | null,
    stepParam: string | null,
  ): Promise<void> {
    await this.store.load();

    if (!lessonId) {
      const target =
        this.store.recommendedLesson() ?? CURRICULUM[0]?.lessons[0] ?? null;
      if (!target) return;
      const savedStep =
        (this.store.progressById()[target.id]?.lastStep ?? 0) + 1;
      await this.nav.goToLesson(target.id, savedStep, true);
      return;
    }

    if (!findLesson(lessonId)) {
      await this.nav.goToLearnRoot(true);
      return;
    }

    if (!stepParam) {
      const savedStep =
        (this.store.progressById()[lessonId]?.lastStep ?? 0) + 1;
      await this.nav.goToLesson(lessonId, savedStep, true);
      return;
    }

    const parsed = Number(stepParam);
    const requestedIndex = Number.isFinite(parsed) ? Math.floor(parsed) - 1 : 0;
    const lesson = await this.store.openLesson(lessonId, requestedIndex);
    if (!lesson) {
      await this.nav.goToLearnRoot(true);
      return;
    }

    const clamped = this.store.activeStepIndex();
    if (this.syncedLessonId !== lesson.id) {
      this.syncedLessonId = lesson.id;
      this.timeline.reset(lesson.steps.length, clamped);
    } else if (this.timeline.index() !== clamped) {
      this.timeline.seek(clamped);
    }
    this.packetPlaying.set(true);

    if (parsed !== clamped + 1) {
      await this.nav.goToLesson(lessonId, clamped + 1, true);
    }
  }
}
