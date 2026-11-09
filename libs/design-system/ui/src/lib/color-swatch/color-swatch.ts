import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { isRtl } from '../direction';

export type SwatchFinish = 'gloss' | 'metallic' | 'matte' | 'pearl';
export type SwatchSize = 'sm' | 'md' | 'lg';

export interface ColorSwatchItem {
  id: string;
  name: string;
  hex: string;
  accentHex?: string;
  finish?: SwatchFinish;
  priceLabel?: string;
}

/**
 * Colour swatch picker following the WAI-ARIA radio group pattern:
 * - one tab stop: the selected swatch, or the first one when nothing is
 *   selected yet, so the group is always reachable by keyboard;
 * - arrow keys move focus and selection together (mirrored right-to-left),
 *   Home/End jump to the ends;
 * - `value` is two-way (`[(value)]`); `selectionChange` also reports the
 *   chosen item.
 * Supports metallic, matte, gloss and pearl finishes.
 */
@Component({
  selector: 'ah-color-swatch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-color-swatch-group',
    role: 'radiogroup',
    '[attr.aria-label]': 'label()',
  },
  templateUrl: './color-swatch.html',
  styleUrl: './color-swatch.scss',
})
export class ColorSwatch {
  readonly items = input<readonly ColorSwatchItem[]>([]);
  readonly value = model<string>('');
  readonly label = input<string>('Color options');
  readonly size = input<SwatchSize>('md');
  readonly disabled = input<boolean>(false);

  readonly selectionChange = output<ColorSwatchItem>();

  private readonly buttons =
    viewChildren<ElementRef<HTMLButtonElement>>('swatch');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Index of the one swatch in the tab order. */
  protected readonly tabStop = computed(() =>
    Math.max(
      0,
      this.items().findIndex((item) => item.id === this.value()),
    ),
  );

  protected select(item: ColorSwatchItem): void {
    if (this.disabled() || this.value() === item.id) {
      return;
    }
    this.value.set(item.id);
    this.selectionChange.emit(item);
  }

  protected onKeyDown(event: KeyboardEvent, index: number): void {
    const list = this.items();
    if (!list.length || this.disabled()) return;

    // Right-to-left, the right arrow goes to the previous swatch.
    const forward = isRtl(this.host.nativeElement) ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    let targetIndex = -1;
    switch (event.key) {
      case forward:
      case 'ArrowDown':
        targetIndex = (index + 1) % list.length;
        break;
      case back:
      case 'ArrowUp':
        targetIndex = (index - 1 + list.length) % list.length;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = list.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextItem = list[targetIndex];
    if (nextItem) {
      this.select(nextItem);
      this.buttons()[targetIndex]?.nativeElement.focus();
    }
  }
}
