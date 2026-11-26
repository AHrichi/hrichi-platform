import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Dial,
  type DialMark,
  Ruler,
  SegmentedControl,
  type SegmentedOption,
  Stepper,
  Thermometer,
} from '@ah/ui';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldInfo } from '../../science/field-info';
import { type FieldControl, LONGEST_SCALE } from './field-control';

let nextId = 0;

/** Width of the advice popover, px. */
const TIP_WIDTH = 288;
/** Hours marked round a clock face. */
const QUARTER_HOURS = [0, 6, 12, 18];
/** Weeks where January, April, July and October begin. */
const SEASON_WEEKS = [1, 14, 27, 40];

/**
 * A labelled number, set the way its kind of value suits (`FieldControl`):
 * a dial for a share, a thermometer for a temperature, a tape for a
 * measurement, − and + for a count or a very wide range, chips for a few
 * choices, a clock for an hour or a week. Except for chips, the exact value
 * can always be typed; the typed field carries the label and the keyboard,
 * and the dial, thermometer or tape beside it is a pointer-only aid.
 * Values outside min..max are clamped when the field loses focus. The ⓘ
 * opens how to get the value (measure, datasheet, setting…), the instrument
 * and a link to the phenomenon on the Science page, in a popover that sits
 * above every panel and closes on Escape or a click elsewhere.
 */
@Component({
  selector: 'sc-number-field',
  imports: [RouterLink, Dial, Ruler, SegmentedControl, Stepper, Thermometer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './number-field.html',
  styleUrl: './number-field.scss',
  host: { '(window:scroll)': 'closeTip()' },
})
export class NumberField {
  readonly label = input.required<string>();
  readonly unit = input<string>();
  readonly hint = input<string>();
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly value = model.required<number>();
  readonly info = input<FieldInfo | null>(null);
  readonly control = input<FieldControl>('ruler');

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly id = `sc-number-${nextId++}`;
  protected readonly tipOpen = signal(false);
  private readonly button = viewChild<ElementRef<HTMLElement>>('infoButton');
  private readonly tip = viewChild<ElementRef<HTMLElement>>('tip');

  protected readonly hintId = computed(() =>
    this.hint() ? `${this.id}-hint` : null,
  );

  /** Too many steps for single nudges: − and + go round number to round number. */
  protected readonly adaptive = computed(
    () => (this.max() - this.min()) / this.step() > LONGEST_SCALE,
  );

  protected readonly chips = computed<SegmentedOption<string>[]>(() => {
    const options: SegmentedOption<string>[] = [];
    for (let v = this.min(); v <= this.max(); v += this.step()) {
      options.push({ value: String(v), label: this.i18n.num(v, 0) });
    }
    return options;
  });

  protected readonly hourMarks = computed<DialMark[]>(() =>
    QUARTER_HOURS.map((hour) => {
      // A range of 1..24 shows midnight as 24.
      const value = hour < this.min() ? hour + 24 : hour;
      return { value, label: this.i18n.num(value, 0) };
    }),
  );

  protected readonly hourText = computed(
    () => (hour: number) => `${this.i18n.num(hour, 0)}:00`,
  );

  protected readonly weekMarks = computed<DialMark[]>(() => {
    const month = new Intl.DateTimeFormat(this.i18n.locale(), {
      month: 'short',
    });
    return SEASON_WEEKS.map((week) => ({
      value: week,
      label: month.format(weekDate(week)),
    }));
  });

  /**
   * The middle of the year wheel names the month the week falls in, short
   * enough to clear the season labels.
   */
  protected readonly weekText = computed(() => {
    const month = new Intl.DateTimeFormat(this.i18n.locale(), {
      month: 'short',
    });
    return (week: number) => month.format(weekDate(week));
  });

  protected onInput(raw: string): void {
    const value = Number(raw);
    if (raw !== '' && Number.isFinite(value)) {
      this.value.set(value);
    }
  }

  protected clamp(): void {
    const value = Math.min(this.max(), Math.max(this.min(), this.value()));
    if (value !== this.value()) {
      this.value.set(value);
    }
  }

  /**
   * Places the popover under its ⓘ, inside the window, on the reading side,
   * before it shows (so it never flashes in a corner).
   */
  protected place(event: Event): void {
    const tip = event.target as HTMLElement;
    const button = this.button()?.nativeElement;
    if ((event as ToggleEvent).newState !== 'open' || !button) return;
    const rect = button.getBoundingClientRect();
    const page = document.documentElement.clientWidth;
    const width = Math.min(TIP_WIDTH, page - 16);
    const start = this.i18n.isRtl() ? rect.left : rect.right - width;
    const left = Math.max(8, Math.min(start, page - width - 8));
    tip.style.top = `${rect.bottom + 6}px`;
    tip.style.left = `${left}px`;
  }

  protected closeTip(): void {
    const tip = this.tip()?.nativeElement;
    if (this.tipOpen() && tip?.matches(':popover-open')) tip.hidePopover();
  }
}

/** A Thursday in that week of a common year, so the month is the week's own. */
function weekDate(week: number): Date {
  return new Date(2026, 0, 1 + (week - 1) * 7);
}
