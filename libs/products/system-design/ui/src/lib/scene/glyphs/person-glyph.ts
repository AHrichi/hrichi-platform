import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { iso, type SceneNode } from '@ah/products/system-design/domain';
import { isoBox, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric person glyph ("You"): pill label with the user icon over a tile
 * plinth.
 */
@Component({
  selector: 'g[sd-person-glyph], sd-person-glyph',
  templateUrl: './person-glyph.html',
  styleUrl: './person-glyph.scss',
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
export class SdPersonGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly plinth = isoBox(0.36, 0, 0.22);
  protected readonly pillCenter = iso({ x: 0, y: 0 }, 0.72);
  protected readonly pillWidth = computed(() =>
    Math.max(54, Math.round(this.node().label.length * 6.8 + 28)),
  );

  protected readonly hostClasses = computed(
    () =>
      `glyph glyph-person hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
