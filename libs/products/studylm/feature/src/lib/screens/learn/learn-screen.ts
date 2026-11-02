import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { loadBuiltInLessons } from '@ah/products/studylm/lessons';
import { StudyLmStorageService } from '../../services/studylm-storage.service';

const TIER_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

/** The built-in lessons, with how far the learner got in each. */
@Component({
  selector: 'ah-studylm-learn-screen',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <h2>Lessons</h2>
      <p>
        Each lesson explains one idea with visuals you step through, and asks
        you to predict, explain and practise as you go. They work offline.
      </p>
    </header>
    @if (lessons.isLoading()) {
      <p role="status">Loading the lessons…</p>
    } @else if (lessons.error()) {
      <p role="alert">The lessons couldn’t be loaded. Reload to try again.</p>
    } @else {
      <ul class="grid">
        @for (lesson of cards(); track lesson.id) {
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
        }
      </ul>
    }
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

  protected readonly lessons = resource({
    loader: async () => {
      const [lessons, progress] = await Promise.all([
        loadBuiltInLessons(),
        this.storage.getAllLessonProgress(),
      ]);
      return { lessons, progress };
    },
  });

  protected readonly cards = computed(() => {
    const value = this.lessons.value();
    if (!value) return [];
    const progress = new Map(value.progress.map((p) => [p.lessonId, p]));
    return [...value.lessons]
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .map((lesson) => {
        const saved = progress.get(lesson.id);
        const checks = lesson.sections
          .flatMap((s) => s.blocks)
          .filter((b) =>
            [
              'predict',
              'quiz',
              'self-explain',
              'order-steps',
              'categorize',
              'parsons',
              'predict-output',
              'cloze',
            ].includes(b.kind),
          ).length;
        return {
          ...lesson,
          checks,
          answered: Object.keys(saved?.checks ?? {}).length,
          started: saved !== undefined,
          done: saved?.completedAt != null,
        };
      });
  });
}
