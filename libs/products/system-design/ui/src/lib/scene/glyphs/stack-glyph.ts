import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SceneNode } from '@ah/products/system-design/domain';
import { isoBox, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric stack glyph (queue, stream): three thin slabs stacked with gaps.
 */
@Component({
  selector: 'g[sd-stack-glyph], sd-stack-glyph',
  templateUrl: './stack-glyph.html',
  styleUrl: './stack-glyph.scss',
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
export class SdStackGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly slabs = [
    isoBox(0.42, 0, 0.25),
    isoBox(0.42, 0.38, 0.63),
    isoBox(0.42, 0.76, 1.01),
  ] as const;
  protected readonly topSlab = this.slabs[2];

  protected readonly hostClasses = computed(
    () => `glyph glyph-stack hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
