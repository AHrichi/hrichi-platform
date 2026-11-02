import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  LessonView,
  type LessonProgressState,
} from '@ah/products/studylm/learn';
import { CATALOG, loadBuiltInLessons } from '@ah/products/studylm/lessons';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { StudyLmStorageService } from '../../services/studylm-storage.service';

/** One lesson, opened where the learner left it, or followed as it's written. */
@Component({
  selector: 'ah-studylm-lesson-screen',
  imports: [LessonView, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back" routerLink="..">← All lessons</a>

    @if (job(); as j) {
      @if (j.status === 'planning' || j.status === 'writing') {
        <section
          class="progress"
          aria-live="polite"
          aria-label="Writing the lesson"
        >
          <p class="title">
            {{
              j.status === 'planning'
                ? 'Planning the lesson…'
                : 'Writing block ' + done() + ' of ' + planned().length + '…'
            }}
          </p>
          <ol class="blocks">
            @for (b of planned(); track b.id) {
              <li [class]="b.state">
                <span aria-hidden="true">{{ icons[b.state] }}</span>
                {{ b.label }}
              </li>
            }
          </ol>
          <button type="button" class="ghost" (click)="cancel()">Cancel</button>
        </section>
      } @else if (j.status === 'failed') {
        <p class="error" role="alert">
          The lesson couldn’t be written: {{ j.error }}
          <a routerLink="../../roadmap">Back to the roadmap</a> to try again.
        </p>
      } @else if (j.status === 'cancelled') {
        <p class="error" role="status">Writing was cancelled.</p>
      }
    }

    @if (skipped().length) {
      <section class="skipped" aria-label="Skipped blocks">
        <p>
          {{ skipped().length }}
          {{ skipped().length === 1 ? 'block was' : 'blocks were' }} left out:
          the AI's version failed the checks, even after a repair.
        </p>
        <ul>
          @for (s of skipped(); track s.id) {
            <li>
              <strong>{{ s.label }}</strong
              >: {{ s.reason }}
              <button
                type="button"
                class="ghost"
                (click)="retry(s.id)"
                [disabled]="busy()"
              >
                Try this block again
              </button>
            </li>
          }
        </ul>
      </section>
    }

    @if (lesson(); as current) {
      <sl-lesson-view
        [lesson]="current"
        [progress]="data.value()?.progress ?? null"
        (progressChange)="save($event)"
      />
    } @else if (data.isLoading()) {
      <p role="status">Loading the lesson…</p>
    } @else if (!job()) {
      <p role="alert">There’s no lesson at this address.</p>
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
    .progress,
    .skipped {
      display: grid;
      gap: var(--space-2);
      max-inline-size: 52rem;
      padding: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
    }
    .title,
    .skipped p {
      margin: 0;
    }
    .title {
      font-weight: var(--font-weight-semibold);
    }
    .blocks {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--font-size-200);
    }
    .blocks .pending {
      color: var(--color-text-muted);
    }
    .blocks .skipped {
      color: var(--color-warning-default);
    }
    .skipped ul {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding-inline-start: var(--space-4);
    }
    .error {
      color: var(--color-danger-default);
    }
    .ghost {
      min-block-size: 2.75rem;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-default);
      font: inherit;
      cursor: pointer;
    }
    .progress .ghost {
      justify-self: start;
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
  private readonly generation = inject(LessonGenerationService);

  protected readonly icons: Record<string, string> = {
    pending: '○',
    writing: '…',
    ready: '✓',
    skipped: '!',
  };

  protected readonly data = resource({
    params: () => this.lessonId(),
    loader: async ({ params: id }) => {
      const generated = id.startsWith('gen-');
      const [record, builtIn, progress] = await Promise.all([
        generated ? this.storage.getGeneratedLesson(id) : null,
        generated ? [] : loadBuiltInLessons(),
        this.storage.getLessonProgress(id),
      ]);
      return {
        lesson: record?.lesson ?? builtIn.find((l) => l.id === id) ?? null,
        draft: record?.draft ?? null,
        progress,
      };
    },
  });

  protected readonly job = computed(
    () => this.generation.jobs()[this.lessonId()] ?? null,
  );
  protected readonly busy = computed(() => {
    const status = this.job()?.status;
    return status === 'planning' || status === 'writing';
  });

  /** While writing, the blocks done so far; afterwards, the saved lesson. */
  protected readonly lesson = computed(() =>
    this.busy()
      ? (this.job()?.lesson ?? null)
      : (this.data.value()?.lesson ?? null),
  );

  private readonly draft = computed(() =>
    this.busy()
      ? (this.job()?.draft ?? null)
      : (this.data.value()?.draft ?? null),
  );

  protected readonly planned = computed(() => {
    const draft = this.draft();
    if (!draft) return [];
    return draft.outline.sections.flatMap((section) =>
      section.blocks.map((b) => ({
        id: b.id,
        label: `${section.title}: ${CATALOG[b.kind].label}`,
        state: draft.blocks[b.id]?.state ?? 'pending',
      })),
    );
  });
  protected readonly done = computed(
    () =>
      this.planned().filter((b) => b.state === 'ready' || b.state === 'skipped')
        .length + 1,
  );
  protected readonly skipped = computed(() => {
    const draft = this.draft();
    if (!draft || this.busy()) return [];
    return this.planned().flatMap((b) => {
      const status = draft.blocks[b.id];
      return status?.state === 'skipped'
        ? [{ ...b, reason: status.reason }]
        : [];
    });
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const name = this.lesson()?.title;
      if (name) title.setTitle(`${name} · StudyLM`);
    });
    // When writing finishes, show the saved lesson.
    effect(() => {
      if (this.job()?.status === 'ready') untracked(() => this.data.reload());
    });
  }

  protected cancel(): void {
    this.generation.cancel(this.lessonId());
  }

  protected retry(blockId: string): void {
    void this.generation.retryBlock(this.lessonId(), blockId);
  }

  protected save(progress: LessonProgressState): void {
    void this.storage.saveLessonProgress({
      lessonId: this.lessonId(),
      ...progress,
      updatedAt: new Date().toISOString(),
    });
  }
}
