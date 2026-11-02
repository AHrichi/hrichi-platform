import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  LessonView,
  type LessonProgressState,
} from '@ah/products/studylm/learn';
import { loadBuiltInLessons } from '@ah/products/studylm/lessons';
import { StudyLmStorageService } from '../../services/studylm-storage.service';

/** One lesson, opened where the learner left it. */
@Component({
  selector: 'ah-studylm-lesson-screen',
  imports: [LessonView, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back" routerLink="..">← All lessons</a>
    @if (data.isLoading()) {
      <p role="status">Loading the lesson…</p>
    } @else if (data.value(); as value) {
      @if (value.lesson) {
        <sl-lesson-view
          [lesson]="value.lesson"
          [progress]="value.progress"
          (progressChange)="save($event)"
        />
      } @else {
        <p role="alert">There’s no lesson at this address.</p>
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
    }
    .back {
      justify-self: start;
      color: var(--color-accent-default);
      font-weight: var(--font-weight-semibold);
      text-decoration: none;
    }
  `,
})
export class LessonScreen {
  /** From the route, `learn/:lessonId`; read here so standalone works too. */
  private readonly lessonId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('lessonId') ?? ''),
    ),
    { initialValue: '' },
  );

  private readonly storage = inject(StudyLmStorageService);

  protected readonly data = resource({
    params: () => this.lessonId(),
    loader: async ({ params: id }) => {
      const [lessons, progress] = await Promise.all([
        loadBuiltInLessons(),
        this.storage.getLessonProgress(id),
      ]);
      return {
        lesson: lessons.find((lesson) => lesson.id === id) ?? null,
        progress,
      };
    },
  });

  private readonly title = computed(() => this.data.value()?.lesson?.title);

  constructor() {
    const title = inject(Title);
    effect(() => {
      const name = this.title();
      if (name) title.setTitle(`${name} · StudyLM`);
    });
  }

  protected save(progress: LessonProgressState): void {
    void this.storage.saveLessonProgress({
      lessonId: this.lessonId(),
      ...progress,
      updatedAt: new Date().toISOString(),
    });
  }
}
