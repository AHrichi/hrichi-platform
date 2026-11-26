import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { AhButton } from '../button/button';

let nextId = 0;

/** Which side of its target a coachmark sits on, or how it shows without one. */
export type CoachmarkSide =
  | 'block-start'
  | 'block-end'
  | 'inline-start'
  | 'inline-end'
  | 'center'
  | 'sheet';

/** The coachmark's own words, in the reader's language. */
export interface CoachmarkLabels {
  readonly next: string;
  readonly back: string;
  readonly finish: string;
  readonly close: string;
}

const ENGLISH: CoachmarkLabels = {
  next: 'Next',
  back: 'Back',
  finish: 'Finish',
  close: 'Close',
};

/**
 * One step of a guided tour: a small card that points at part of the page,
 * with a title, a few words, where the reader is ("Step 3 of 8") and Back,
 * Next (Finish on the last step) and Close.
 *
 * It is a non-modal dialog (`role="dialog"`, `aria-modal="false"`): the page
 * stays usable while it shows. It is labelled by its title and progress and
 * described by its body; the host focuses it on each step and gives focus
 * back at the end. Escape inside it dismisses the tour. `side` puts its pointer
 * on the edge facing the target (`arrow`: how far along that edge); a
 * `center` or `sheet` card has none. Positioning is the host's job.
 */
@Component({
  selector: 'ah-coachmark',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coachmark.html',
  styleUrl: './coachmark.scss',
  host: {
    class: 'ah-coachmark',
    role: 'dialog',
    'aria-modal': 'false',
    tabindex: '-1',
    '[attr.aria-labelledby]': "id + '-title ' + id + '-progress'",
    '[attr.aria-describedby]': "id + '-body'",
    '[attr.data-side]': 'side()',
    '[style.--ah-arrow]': "arrow() === null ? null : arrow() + 'px'",
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class Coachmark {
  readonly heading = input.required<string>();
  readonly body = input.required<string>();
  /** 1-based. */
  readonly step = input(1);
  readonly total = input(1);
  /** The progress line, e.g. "Step 3 of 8"; numbers alone when unset. */
  readonly progress = input<string | null>(null);
  readonly side = input<CoachmarkSide>('center');
  readonly arrow = input<number | null>(null);
  readonly labels = input<CoachmarkLabels>(ENGLISH);

  readonly next = output<void>();
  readonly back = output<void>();
  /** Close, or Escape: the reader is done with the tour. */
  readonly dismiss = output<void>();

  protected readonly id = `ah-coachmark-${nextId++}`;
  protected readonly first = computed(() => this.step() <= 1);
  protected readonly last = computed(() => this.step() >= this.total());
  protected readonly dots = computed(() =>
    Array.from({ length: Math.min(this.total(), 12) }, (_, i) => i + 1),
  );
  protected readonly progressText = computed(
    () => this.progress() ?? `${this.step()} / ${this.total()}`,
  );

  protected onEscape(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit();
  }
}
