import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SceneNode } from '@ah/products/system-design/domain';
import { isoBox, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric device glyph (laptop or phone on a raised plinth).
 */
@Component({
  selector: 'g[sd-device-glyph], sd-device-glyph',
  templateUrl: './device-glyph.html',
  styleUrl: './device-glyph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.class]': 'hostClasses()',
    '[attr.transform]': 'hostTransform()',
    '[attr.data-node-id]': 'node().id',
    '[attr.data-kind]': 'node().kind',
    '[attr.data-state]': 'view().state',
    '[attr.data-hue]': 'view().hue',
  },
})
export class SdDeviceGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly plinth = isoBox(0.44, 0, 0.35);
  protected readonly chassis = isoBox(0.28, 0.35, 0.95);

  protected readonly hostClasses = computed(
    () =>
      `glyph glyph-device hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
