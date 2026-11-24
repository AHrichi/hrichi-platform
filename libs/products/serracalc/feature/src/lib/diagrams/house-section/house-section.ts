import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  type GreenhouseSpec,
  roofSectionsPerSpan,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import type { SvgPoint } from '../svg-drag';

const W = 480;
const H = 250;
const GROUND = 205;
const SIDE = 46;
const TOP = 26;
/** Spans drawn before the rest is shown as a break. */
const MAX_SPANS = 3;
/** Room for the break mark and its count. */
const BREAK = 44;

export const HOUSE_LIMITS = {
  gutter: { min: 1, max: 8, step: 0.1 },
  ridge: { min: 1.5, max: 12, step: 0.1 },
  span: { min: 3, max: 16, step: 0.1 },
} as const;

interface Layout {
  /** Pixels per metre, the same both ways. */
  k: number;
  x0: number;
}

/**
 * The house in cross-section, drawn to scale: walls to the gutter, a pitched
 * roof or an arch over each roof section, posts between spans. A wide house
 * shows its first spans and a break, so the heights stay readable. Drag the
 * gutter, the ridge or the first span's edge; the zoom holds while dragging.
 */
@Component({
  selector: 'sc-house-section',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './house-section.html',
  styleUrl: './house-section.scss',
})
export class HouseSection {
  readonly spec = input.required<GreenhouseSpec>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly width = W;
  protected readonly height = H;
  protected readonly ground = GROUND;
  protected readonly limits = HOUSE_LIMITS;

  /** The scale and origin, held while a handle is dragged. */
  private readonly held = signal<Layout | null>(null);

  private readonly shown = computed(() =>
    Math.min(MAX_SPANS, Math.max(1, Math.round(this.spec().spans))),
  );
  protected readonly hidden = computed(
    () => Math.max(1, Math.round(this.spec().spans)) - this.shown(),
  );

  private readonly layout = computed<Layout>(() => {
    const held = this.held();
    if (held) return held;
    const s = this.spec();
    const width = Math.max(1, this.shown() * s.spanWidthM);
    const tall = Math.max(s.ridgeHeightM, s.gutterHeightM, 1);
    const gap = this.hidden() > 0 ? BREAK : 0;
    const k = Math.min((W - 2 * SIDE - gap) / width, (GROUND - TOP) / tall);
    return { k, x0: (W - width * k - gap) / 2 };
  });

  protected readonly geometry = computed(() => {
    const s = this.spec();
    const { k, x0 } = this.layout();
    const spans = this.shown();
    const width = spans * s.spanWidthM * k;
    const gap = this.hidden() > 0 ? BREAK : 0;
    const yGutter = GROUND - s.gutterHeightM * k;
    const rise = Math.max(0, s.ridgeHeightM - s.gutterHeightM) * k;
    const sections = roofSectionsPerSpan(s);
    const sectionWidth = (s.spanWidthM / sections) * k;
    let roof = `M${x0} ${GROUND}V${yGutter}`;
    for (let i = 0; i < spans * sections; i++) {
      const xa = x0 + i * sectionWidth;
      const xb = xa + sectionWidth;
      roof +=
        s.shape === 'tunnel'
          ? `A${sectionWidth / 2} ${Math.max(0.1, rise)} 0 0 1 ${xb} ${yGutter}`
          : `L${(xa + xb) / 2} ${yGutter - rise}L${xb} ${yGutter}`;
    }
    roof += `V${GROUND}Z`;
    const posts = Array.from(
      { length: spans - 1 },
      (_, i) => x0 + (i + 1) * s.spanWidthM * k,
    );
    return {
      x0,
      x1: x0 + width,
      breakX: x0 + width + gap / 2,
      /** The ridge's dimension sits past the break. */
      ridgeX: x0 + width + gap,
      ridgeTipX: x0 + width - sectionWidth / 2,
      firstRidgeX: x0 + sectionWidth / 2,
      yGutter,
      yRidge: yGutter - rise,
      roof,
      posts,
      firstSpanEnd: x0 + s.spanWidthM * k,
    };
  });

  protected readonly alt = computed(() => {
    const s = this.spec();
    return this.t().greenhouse.sectionAlt(
      String(s.spans),
      this.i18n.num(s.spanWidthM),
      this.i18n.num(s.gutterHeightM),
      this.i18n.num(s.ridgeHeightM),
    );
  });

  /** Height above the ground at a pointer, in metres. */
  protected readonly heightAt = (p: SvgPoint): number =>
    (GROUND - p.y) / this.layout().k;
  /** Width from the left wall to a pointer, in metres. */
  protected readonly spanAt = (p: SvgPoint): number =>
    (p.x - this.layout().x0) / this.layout().k;

  protected hold(): void {
    this.held.set(this.layout());
  }

  protected release(): void {
    this.held.set(null);
  }
}
