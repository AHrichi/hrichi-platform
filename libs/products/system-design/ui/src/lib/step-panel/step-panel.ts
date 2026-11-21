import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type {
  Callout,
  Change,
  IconName,
  LessonStep,
  StepKind,
} from '@ah/products/system-design/domain';
import { SdIcon } from '../icon/icon';
import { SdInlineText } from '../inline-text/inline-text';

const STEP_KIND_LABELS: Readonly<Record<StepKind, string>> = {
  problem: 'Problem',
  technique: 'Technique',
  case: 'Case',
  'watch-out': 'Watch out',
  recap: 'Recap',
};

const CALLOUT_META: Readonly<
  Record<Callout['kind'], { label: string; icon: IconName }>
> = {
  'key-idea': { label: 'Key idea', icon: 'bolt' },
  'good-to-know': { label: 'Good to know', icon: 'file' },
  'watch-out': { label: 'Watch out', icon: 'warning' },
  'coming-up': { label: 'Coming up', icon: 'route' },
};

const CHANGE_PREFIX: Readonly<Record<Change['type'], string>> = {
  added: '+',
  changed: '~',
  removed: '−',
};

/**
 * Right-column step explanation panel (`sd-step-panel`).
 * Projects `<ng-content select="[sdRecapActions]">` on the recap step so the
 * feature layer can place `<ah-learn-this>` without crossing module boundaries.
 */
@Component({
  selector: 'sd-step-panel',
  imports: [SdIcon, SdInlineText],
  templateUrl: './step-panel.html',
  styleUrl: './step-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdStepPanel {
  readonly step = input.required<LessonStep>();
  /** 0-based current step index. */
  readonly stepIndex = input.required<number>();
  /** Total steps in the lesson. */
  readonly stepCount = input.required<number>();
  /** Optional label of the next step (`"Next: <label>"`). */
  readonly nextStepLabel = input<string | null>(null);
  readonly canBack = input<boolean>(true);
  readonly canNext = input<boolean>(true);
  /** Optional title of the next lesson in the course, shown on recap. */
  readonly nextLessonTitle = input<string | null>(null);
  readonly showKeyHints = input<boolean>(true);

  readonly back = output<void>();
  readonly next = output<void>();
  readonly practiceRequested = output<void>();
  readonly nextLessonRequested = output<void>();

  protected readonly stepNumber = computed(() => this.stepIndex() + 1);
  protected readonly kindLabel = computed(
    () => STEP_KIND_LABELS[this.step().kind],
  );
  protected readonly nextButtonText = computed(() => {
    const lbl = this.nextStepLabel();
    return lbl ? `Next: ${lbl} →` : 'Next →';
  });

  protected calloutLabel(kind: Callout['kind']): string {
    return CALLOUT_META[kind].label;
  }

  protected calloutIcon(kind: Callout['kind']): IconName {
    return CALLOUT_META[kind].icon;
  }

  protected changeSymbol(type: Change['type']): string {
    return CHANGE_PREFIX[type];
  }
}
