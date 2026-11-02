import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  type Block,
  CHECK_KINDS,
  type Lesson,
} from '@ah/products/studylm/lessons';
import { CategorizeCheck, OrderStepsCheck } from '../checks/arrange-checks';
import type { CheckRecord } from '../checks/check-shared';
import { PredictCheck, QuizCheck } from '../checks/choice-checks';
import {
  ClozeCheck,
  ParsonsCheck,
  PredictOutputCheck,
} from '../checks/code-checks';
import { SelfExplainCheck } from '../checks/self-explain-check';
import { injectReducedMotion } from '../player/reduced-motion';
import { type SeekRequest, SteppedVisual } from '../player/stepped-visual';
import { MarkdownView } from '../text/markdown-view';
import { ChartView } from '../visuals/chart-view';

/** What a learner has done in a lesson, kept on their device. */
export interface LessonProgressState {
  steps: Record<string, number>;
  checks: Record<string, CheckRecord>;
  completedAt: string | null;
}

const TONES: Record<string, { label: string; icon: string }> = {
  'key-idea': { label: 'Key idea', icon: '💡' },
  analogy: { label: 'Analogy', icon: '🔁' },
  pitfall: { label: 'Pitfall', icon: '⚠️' },
  tip: { label: 'Tip', icon: '✨' },
  definition: { label: 'Definition', icon: '📖' },
};

/**
 * A whole lesson: objectives, then sections of narrated visuals and checks,
 * then a summary. Every check answer and the step each visual was left on
 * are reported as progress, so a reload reopens where the learner was.
 */
@Component({
  selector: 'sl-lesson-view',
  imports: [
    CategorizeCheck,
    ClozeCheck,
    ChartView,
    MarkdownView,
    OrderStepsCheck,
    ParsonsCheck,
    PredictCheck,
    PredictOutputCheck,
    QuizCheck,
    SelfExplainCheck,
    SteppedVisual,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-view.html',
  styleUrl: './lesson-view.scss',
})
export class LessonView {
  readonly lesson = input.required<Lesson>();
  readonly progress = input<LessonProgressState | null>(null);
  readonly progressChange = output<LessonProgressState>();

  private readonly document = inject(DOCUMENT);
  private readonly reducedMotion = injectReducedMotion();

  protected readonly tones = TONES;
  protected readonly checks = linkedSignal<Record<string, CheckRecord>>(
    () => this.progress()?.checks ?? {},
  );
  private readonly steps = linkedSignal<Record<string, number>>(
    () => this.progress()?.steps ?? {},
  );
  protected readonly completedAt = linkedSignal(
    () => this.progress()?.completedAt ?? null,
  );
  /** Initial steps, read once so a visual isn't reset as the learner moves. */
  protected readonly startSteps = computed(() => this.progress()?.steps ?? {});
  protected readonly seeks = signal<Record<string, SeekRequest>>({});

  protected readonly answered = computed(
    () => new Set(Object.keys(this.checks())),
  );

  private readonly checkBlocks = computed(() =>
    this.lesson().sections.flatMap((section) =>
      section.blocks.filter((block) =>
        (CHECK_KINDS as readonly string[]).includes(block.kind),
      ),
    ),
  );
  protected readonly score = computed(() => {
    const checks = this.checks();
    const blocks = this.checkBlocks();
    return {
      total: blocks.length,
      answered: blocks.filter((b) => checks[b.id]).length,
      right: blocks.filter((b) => checks[b.id]?.correct).length,
    };
  });

  protected record(id: string): CheckRecord | null {
    return this.checks()[id] ?? null;
  }

  protected onAnswered(id: string, record: CheckRecord): void {
    this.checks.update((checks) => ({ ...checks, [id]: record }));
    this.emit();
  }

  protected onStep(id: string, index: number): void {
    if (this.steps()[id] === index) return;
    this.steps.update((steps) => ({ ...steps, [id]: index }));
    this.emit();
  }

  /** Shows the visual a prediction was about, at the step that answers it. */
  protected reveal(block: Block): void {
    if (block.kind !== 'predict' || !block.reveal) return;
    const { block: target, step } = block.reveal;
    this.seeks.update((seeks) => ({
      ...seeks,
      [target]: { step, at: Date.now() },
    }));
    this.scrollTo(`block-${target}`);
  }

  protected complete(): void {
    this.completedAt.set(new Date().toISOString());
    this.emit();
  }

  protected scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({
      behavior: this.reducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  private emit(): void {
    this.progressChange.emit({
      steps: this.steps(),
      checks: this.checks(),
      completedAt: this.completedAt(),
    });
  }
}
