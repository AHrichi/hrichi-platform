import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CHECK_KINDS,
  type Lesson,
  loadBuiltInLessons,
} from '@ah/products/studylm/lessons';
import { StudyLmStore } from '../../store/studylm.store';
import {
  type LessonProgress,
  StudyLmStorageService,
} from '../../services/studylm-storage.service';

const TIER_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

/** Your lessons by subject, then the built-in ones, with your progress. */
@Component({
  selector: 'ah-studylm-learn-screen',
  imports: [NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <h2>Lessons</h2>
      <p>
        Each lesson explains one idea with visuals you step through, and asks
        you to predict, explain and practise as you go. Write one for any
        roadmap section from the Roadmap screen; the built-in ones work offline.
      </p>
    </header>
    @for (group of yours(); track group.subject) {
      <section class="group" [attr.aria-label]="group.subject">
        <h3 class="group-title">{{ group.subject }}</h3>
        <ul class="grid">
          @for (lesson of group.cards; track lesson.id) {
            <ng-container
              *ngTemplateOutlet="card; context: { $implicit: lesson }"
            />
          }
        </ul>
      </section>
    }
    @if (lessons.isLoading()) {
      <p role="status">Loading the lessons…</p>
    } @else if (lessons.error()) {
      <p role="alert">The lessons couldn’t be loaded. Reload to try again.</p>
    } @else {
      <section class="group" aria-label="Built-in lessons">
        @if (yours().length) {
          <h3 class="group-title">Built-in lessons</h3>
        }
        <ul class="grid">
          @for (lesson of cards(); track lesson.id) {
            <ng-container
              *ngTemplateOutlet="card; context: { $implicit: lesson }"
            />
          }
        </ul>
      </section>
    }
    <ng-template #card let-lesson>
      <li class="card">
        <p class="meta">
          <span class="tier">{{ lesson.tier }}</span>
          <span>{{ lesson.minutes }} min</span>
        </p>
        <h3>
          <a [routerLink]="lesson.id">{{ lesson.title }}</a>
        </h3>
        <ul class="objectives">
          @for (objective of lesson.objectives; track $index) {
            <li>{{ objective }}</li>
          }
        </ul>
        <p class="progress">
          @if (lesson.done) {
            ✓ Complete
          } @else if (lesson.started) {
            In progress: {{ lesson.answered }} of {{ lesson.checks }} checks
          } @else {
            Not started
          }
        </p>
      </li>
    </ng-template>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-5);
    }
    h2,
    h3,
    p {
      margin: 0;
    }
    .head {
      display: grid;
      gap: var(--space-2);
      max-inline-size: 48rem;
      color: var(--color-text-muted);
      h2 {
        color: var(--color-text-default);
      }
    }
    .group {
      display: grid;
      gap: var(--space-3);
    }
    .group-title {
      font-size: var(--font-size-400);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .card {
      position: relative;
      display: grid;
      align-content: start;
      gap: var(--space-2);
      padding: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
    }
    .card:focus-within,
    .card:hover {
      border-color: var(--color-accent-default);
    }
    h3 a {
      color: var(--color-text-default);
      text-decoration: none;
      /* The whole card is the link's target. */
      &::after {
        content: '';
        position: absolute;
        inset: 0;
      }
    }
    .meta {
      display: flex;
      gap: var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--font-size-100);
    }
    .tier {
      color: var(--color-accent-default);
      font-weight: var(--font-weight-bold);
      text-transform: capitalize;
    }
    .objectives {
      margin: 0;
      padding-inline-start: var(--space-4);
      color: var(--color-text-muted);
      font-size: var(--font-size-200);
      line-height: 1.5;
    }
    .progress {
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-semibold);
    }
  `,
})
export class LearnScreen {
  private readonly storage = inject(StudyLmStorageService);
  private readonly store = inject(StudyLmStore);

  protected readonly lessons = resource({
    loader: async () => {
      const [lessons, progress, generated] = await Promise.all([
        loadBuiltInLessons(),
        this.storage.getAllLessonProgress(),
        this.storage.listGeneratedLessons(),
      ]);
      return { lessons, progress, generated };
    },
  });

  private readonly progress = computed(
    () =>
      new Map(
        (this.lessons.value()?.progress ?? []).map((p) => [p.lessonId, p]),
      ),
  );

  protected readonly cards = computed(() =>
    [...(this.lessons.value()?.lessons ?? [])]
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .map((lesson) => card(lesson, this.progress().get(lesson.id))),
  );

  /** The lessons the AI wrote for you, grouped by subject. */
  protected readonly yours = computed(() => {
    const titles = new Map(this.store.subjects().map((s) => [s.id, s.title]));
    const groups = new Map<string, ReturnType<typeof card>[]>();
    for (const record of this.lessons.value()?.generated ?? []) {
      const subject = titles.get(record.subjectId) ?? 'Other subjects';
      const list = groups.get(subject) ?? [];
      list.push(card(record.lesson, this.progress().get(record.id)));
      groups.set(subject, list);
    }
    return [...groups].map(([subject, cards]) => ({ subject, cards }));
  });
}

function card(lesson: Lesson, saved: LessonProgress | undefined) {
  const checks = lesson.sections
    .flatMap((s) => s.blocks)
    .filter((b) => (CHECK_KINDS as readonly string[]).includes(b.kind)).length;
  return {
    ...lesson,
    checks,
    answered: Object.keys(saved?.checks ?? {}).length,
    started: saved !== undefined,
    done: saved?.completedAt != null,
  };
}
