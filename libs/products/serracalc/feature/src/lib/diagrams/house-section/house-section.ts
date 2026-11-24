import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  type GreenhouseSpec,
  roofSectionsPerSpan,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';

const W = 480;
const H = 250;
const GROUND = 205;
const SIDE = 46;
const TOP = 26;

/** Spans drawn before the rest is shown as a break. */
const MAX_SPANS = 3;
/** Room for the break mark and its count. */
const BREAK = 44;

/**
 * The house in cross-section, drawn to scale: walls to the gutter, a pitched
 * roof or an arch over each roof section, posts between spans. A wide house
 * shows its first spans and a break, so the heights stay readable.
 */
@Component({
  selector: 'sc-house-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './house-section.html',
  styleUrl: './house-section.scss',
})
export class HouseSection {
  readonly spec = input.required<GreenhouseSpec>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly width = W;
  protected readonly height = H;
  protected readonly ground = GROUND;

  private readonly shown = computed(() =>
    Math.min(MAX_SPANS, Math.max(1, Math.round(this.spec().spans))),
  );
  protected readonly hidden = computed(
    () => Math.max(1, Math.round(this.spec().spans)) - this.shown(),
  );

  private readonly scale = computed(() => {
    const s = this.spec();
    const width = Math.max(1, this.shown() * s.spanWidthM);
    const tall = Math.max(s.ridgeHeightM, s.gutterHeightM, 1);
    const room = W - 2 * SIDE - (this.hidden() > 0 ? BREAK : 0);
    return Math.min(room / width, (GROUND - TOP) / tall);
  });

  protected readonly geometry = computed(() => {
    const s = this.spec();
    const k = this.scale();
    const spans = this.shown();
    const width = spans * s.spanWidthM * k;
    const gap = this.hidden() > 0 ? BREAK : 0;
    const x0 = (W - width - gap) / 2;
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
}
