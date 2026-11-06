import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

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
 * Accessible color swatch selector conforming to WAI-ARIA Radio Group pattern.
 * Supports metallic, matte, gloss and pearl automotive/product finishes.
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
  readonly value = input<string>('');
  readonly label = input<string>('Color options');
  readonly size = input<SwatchSize>('md');
  readonly disabled = input<boolean>(false);

  readonly selectionChange = output<ColorSwatchItem>();

  protected select(item: ColorSwatchItem): void {
    if (this.disabled() || this.value() === item.id) {
      return;
    }
    this.selectionChange.emit(item);
  }

  protected onKeyDown(event: KeyboardEvent, index: number): void {
    const list = this.items();
    if (!list.length || this.disabled()) return;

    let targetIndex = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        targetIndex = (index + 1) % list.length;
        break;
      case 'ArrowLeft':
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
    }
  }
}
