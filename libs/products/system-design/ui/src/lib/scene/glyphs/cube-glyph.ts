import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SceneNode } from '@ah/products/system-design/domain';
import { isoBox, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric cube glyph (height 1.1 tiles): top rhombus plus left and right
 * faces, icon on the top face, and label chip below.
 */
@Component({
  selector: 'g[sd-cube-glyph], sd-cube-glyph',
  templateUrl: './cube-glyph.html',
  styleUrl: './cube-glyph.scss',
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
export class SdCubeGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly box = isoBox(0.42, 0, 1.1);

  protected readonly hostClasses = computed(
    () => `glyph glyph-cube hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
