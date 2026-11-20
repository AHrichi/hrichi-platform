import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SceneNode } from '@ah/products/system-design/domain';
import { isoCylinder, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric disk glyph (object storage): short, wide cylinder.
 */
@Component({
  selector: 'g[sd-disk-glyph], sd-disk-glyph',
  templateUrl: './disk-glyph.html',
  styleUrl: './disk-glyph.scss',
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
export class SdDiskGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly cyl = isoCylinder(0.44, 0, 0.55);

  protected readonly hostClasses = computed(
    () => `glyph glyph-disk hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
