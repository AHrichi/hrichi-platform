import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  findLesson,
  pickPractice,
  type PracticeItem,
} from '@ah/products/system-design/domain';
import { PRACTICE_COPY } from '../../copy/practice-copy';
import {
  bestLessonScores,
  lessonQuestions,
  type PracticeQuestion,
} from '../../practice/practice';
import { SystemDesignStore } from '../../store/system-design.store';
import { PracticeRun } from './practice-run';

/**
 * Practice home (`practice`): modules → lessons with each lesson's best
 * score, plus the "Mixed practice · 10 questions" card, locked until a
 * lesson is complete.
 */
@Component({
  selector: 'sd-practice-home',
  imports: [RouterLink],
  templateUrl: './practice-home.html',
  styleUrl: './practice-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeHome {
  protected readonly store = inject(SystemDesignStore);
  protected readonly copy = PRACTICE_COPY;
  /** The shell route: links resolve from it, whatever this route's depth. */
  protected readonly shellRoute = inject(ActivatedRoute).parent;

  protected readonly scores = computed(() =>
    bestLessonScores(this.store.attempts()),
  );
  protected readonly mixReady = computed(() =>
    Object.values(this.store.lessonStatuses()).includes('complete'),
  );
}

/**
 * One lesson's checks (`practice/:lessonId`), in authored order.
 */
@Component({
  selector: 'sd-lesson-practice',
  imports: [PracticeRun, RouterLink],
  templateUrl: './lesson-practice.html',
  styleUrl: './practice-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonPractice {
  protected readonly copy = PRACTICE_COPY;
  private readonly route = inject(ActivatedRoute);
  protected readonly shellRoute = this.route.parent;
  private readonly params = toSignal(this.route.paramMap);
  protected readonly lessonId = computed(
    () => this.params()?.get('lessonId') ?? '',
  );
  protected readonly meta = computed(() => findLesson(this.lessonId()));

  protected readonly data = resource({
    params: () => this.meta(),
    loader: async ({ params: meta }) =>
      lessonQuestions(meta, await meta.load()),
  });

  /** A copy per run, so "Practice again" starts a fresh one. */
  protected readonly questions = linkedSignal<readonly PracticeQuestion[]>(
    () => this.data.value() ?? [],
  );

  protected again(): void {
    this.questions.update((list) => [...list]);
  }
}

/**
 * Up to 10 questions from the finished lessons (`practice/mix`), chosen by
 * `pickPractice`: last answered wrong first, then unseen, then oldest.
 */
@Component({
  selector: 'sd-mixed-practice',
  imports: [PracticeRun, RouterLink],
  templateUrl: './mixed-practice.html',
  styleUrl: './practice-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixedPractice {
  protected readonly copy = PRACTICE_COPY;
  protected readonly shellRoute = inject(ActivatedRoute).parent;
  private readonly store = inject(SystemDesignStore);
  private readonly round = signal(0);

  private readonly completed = computed(() => {
    if (!this.store.ready()) return undefined;
    const statuses = this.store.lessonStatuses();
    return Object.keys(statuses)
      .filter((id) => statuses[id] === 'complete')
      .join(',');
  });

  protected readonly data = resource({
    params: () => {
      const ids = this.completed();
      return ids === undefined ? undefined : { ids, round: this.round() };
    },
    loader: async ({ params }) => {
      const metas = params.ids
        .split(',')
        .map((id) => findLesson(id))
        .filter((m) => m !== undefined);
      const questions = (
        await Promise.all(
          metas.map(async (meta) => lessonQuestions(meta, await meta.load())),
        )
      ).flat();
      const byKey = new Map(
        questions.map((q) => [`${q.lessonId}:${q.check.id}`, q]),
      );
      const items: PracticeItem[] = questions.map((q) => ({
        lessonId: q.lessonId,
        check: q.check,
      }));
      const attempts = untracked(() => this.store.attempts());
      return pickPractice(items, attempts, 10, Date.now() + params.round)
        .map((item) => byKey.get(`${item.lessonId}:${item.check.id}`))
        .filter((q) => q !== undefined);
    },
  });

  protected again(): void {
    this.round.update((n) => n + 1);
  }
}
