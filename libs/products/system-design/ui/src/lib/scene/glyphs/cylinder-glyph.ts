import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SceneNode } from '@ah/products/system-design/domain';
import { isoCylinder, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric cylinder glyph (database, replica, search, cache): ellipse top,
 * left/right shaded body walls, mid seam, and optional load chip above.
 */
@Component({
  selector: 'g[sd-cylinder-glyph], sd-cylinder-glyph',
  templateUrl: './cylinder-glyph.html',
  styleUrl: './cylinder-glyph.scss',
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
export class SdCylinderGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly cyl = isoCylinder(0.36, 0, 1.1);

  protected readonly hostClasses = computed(
    () =>
      `glyph glyph-cylinder hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
