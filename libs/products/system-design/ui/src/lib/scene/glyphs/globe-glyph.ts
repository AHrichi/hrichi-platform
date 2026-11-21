import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { iso, type SceneNode } from '@ah/products/system-design/domain';
import { isoBox, resolveGlyphView } from './glyph-geometry';

/**
 * Isometric globe glyph (CDN, external API): sphere with meridians over a
 * low plinth.
 */
@Component({
  selector: 'g[sd-globe-glyph], sd-globe-glyph',
  templateUrl: './globe-glyph.html',
  styleUrl: './globe-glyph.scss',
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
export class SdGlobeGlyph {
  readonly node = input.required<SceneNode>();
  readonly fresh = input<boolean>(false);

  protected readonly view = computed(() => resolveGlyphView(this.node()));
  protected readonly plinth = isoBox(0.36, 0, 0.22);
  protected readonly center = iso({ x: 0, y: 0 }, 0.78);
  protected readonly r = 17;

  protected readonly hostClasses = computed(
    () => `glyph glyph-globe hue-${this.view().hue} state-${this.view().state}`,
  );

  protected readonly hostTransform = computed(() => {
    const { x, y } = this.view().origin;
    return `translate(${x} ${y})`;
  });
}
