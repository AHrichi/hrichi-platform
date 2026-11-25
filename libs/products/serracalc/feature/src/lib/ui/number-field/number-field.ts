import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldInfo } from '../../science/field-info';

let nextId = 0;

/** Width of the advice popover, px. */
const TIP_WIDTH = 288;

/**
 * A labelled number with a slider: type an exact value, or drag on a phone.
 * Values outside min..max are clamped when the field loses focus. The ⓘ
 * opens how to get the value (measure, datasheet, setting…), the instrument
 * and a link to the phenomenon on the Science page, in a popover that sits
 * above every panel and closes on Escape or a click elsewhere.
 */
@Component({
  selector: 'sc-number-field',
  imports: [RouterLink],
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

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly id = `sc-number-${nextId++}`;
  protected readonly tipOpen = signal(false);
  private readonly button = viewChild<ElementRef<HTMLElement>>('infoButton');
  private readonly tip = viewChild<ElementRef<HTMLElement>>('tip');

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
    const width = Math.min(TIP_WIDTH, window.innerWidth - 16);
    const start = this.i18n.isRtl() ? rect.left : rect.right - width;
    const left = Math.max(8, Math.min(start, window.innerWidth - width - 8));
    tip.style.top = `${rect.bottom + 6}px`;
    tip.style.left = `${left}px`;
  }

  protected closeTip(): void {
    const tip = this.tip()?.nativeElement;
    if (this.tipOpen() && tip?.matches(':popover-open')) tip.hidePopover();
  }
}
