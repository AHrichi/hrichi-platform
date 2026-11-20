import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  canAdd,
  findChallenge,
  formatMs,
  formatPercent,
  type HudMetric,
  LAB_CATALOG,
  LAB_KINDS,
  type LabKind,
  MAX_INSTANCES,
  MAX_RPS,
  MIN_INSTANCES,
  MIN_RPS,
  type MetricTone,
  type MetricValue,
  NODE_KINDS,
} from '@ah/products/system-design/domain';
import { SdHud, SdIcon, SdIsoScene } from '@ah/products/system-design/ui';
import { injectReducedMotion } from '@ah/ui';
import { LAB_COPY } from '../../copy/lab-copy';
import { type LabLinkView, LabStore, SANDBOX_ID } from '../../store/lab.store';

/** The RPS slider runs 0–RPS_STEPS on a log scale from MIN_RPS to MAX_RPS. */
export const RPS_STEPS = 1000;
/** Pause between packet loops, in ms. */
export const PACKET_LOOP_GAP_MS = 400;

/** Slider position → requests a second, rounded to two significant figures. */
export function rpsFromSlider(position: number): number {
  const t = Math.min(1, Math.max(0, position / RPS_STEPS));
  const raw = MIN_RPS * Math.pow(MAX_RPS / MIN_RPS, t);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / magnitude) * magnitude;
}

/** Requests a second → slider position. */
export function sliderFromRps(rps: number): number {
  const t = Math.log(rps / MIN_RPS) / Math.log(MAX_RPS / MIN_RPS);
  return Math.round(Math.min(1, Math.max(0, t)) * RPS_STEPS);
}

export const formatRps = (rps: number): string =>
  `${Math.round(rps).toLocaleString('en-US')} rps`;

const HUD: readonly HudMetric[] = [
  {
    id: 'throughput',
    label: LAB_COPY.hud.throughput,
    icon: 'gauge',
    value: '—',
  },
  { id: 'p50', label: LAB_COPY.hud.p50, icon: 'timer', value: '—' },
  { id: 'p95', label: LAB_COPY.hud.p95, icon: 'clock', value: '—' },
  { id: 'errors', label: LAB_COPY.hud.errors, icon: 'warning', value: '—' },
  { id: 'cost', label: LAB_COPY.hud.cost, icon: 'chart', value: '—' },
];

/**
 * The Design Lab bench (`lab/:challengeId`, `free` for the sandbox): a
 * palette, the live diagram, an inspector, traffic controls, results and the
 * challenge's goals (technical-design §8). Everything works from the keyboard.
 */
@Component({
  selector: 'sd-lab-screen',
  imports: [RouterLink, SdHud, SdIcon, SdIsoScene],
  providers: [LabStore],
  templateUrl: './lab-screen.html',
  styleUrl: './lab-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabScreen {
  protected readonly copy = LAB_COPY;
  protected readonly store = inject(LabStore);
  protected readonly kinds = LAB_KINDS;
  protected readonly catalog = LAB_CATALOG;
  protected readonly nodeKinds = NODE_KINDS;
  protected readonly hud = HUD;
  protected readonly minInstances = MIN_INSTANCES;
  protected readonly maxInstances = MAX_INSTANCES;
  protected readonly rpsSteps = RPS_STEPS;
  protected readonly reducedMotion = injectReducedMotion();
  protected readonly connectChoice = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly paramMap = toSignal(this.route.paramMap);
  private readonly isoScene = viewChild(SdIsoScene);
  private readonly inspectorHeading =
    viewChild<ElementRef<HTMLElement>>('inspectorHeading');
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly challengeId = computed(
    () => this.paramMap()?.get('challengeId') ?? SANDBOX_ID,
  );
  protected readonly known = computed(
    () =>
      this.challengeId() === SANDBOX_ID || !!findChallenge(this.challengeId()),
  );
  protected readonly title = computed(
    () => this.store.challenge()?.title ?? this.copy.sandboxTitle,
  );
  protected readonly brief = computed(
    () => this.store.challenge()?.brief ?? this.copy.sandboxBrief,
  );

  protected readonly metrics = computed<Record<string, MetricValue>>(() => {
    const r = this.store.result();
    const goals = this.store.challenge()?.goals;
    const tone = (ok: boolean | undefined): MetricTone =>
      ok === undefined ? 'normal' : ok ? 'good' : 'bad';
    return {
      throughput: { value: formatRps(r.throughput), tone: 'normal' },
      p50: { value: formatMs(r.p50), tone: 'normal' },
      p95: {
        value: formatMs(r.p95),
        tone: tone(
          goals?.maxP95 === undefined ? undefined : r.p95 <= goals.maxP95,
        ),
      },
      errors: {
        value: formatPercent(r.errorRate),
        tone: tone(
          goals?.maxErrorRate === undefined
            ? r.errorRate > 0
              ? false
              : undefined
            : r.errorRate <= goals.maxErrorRate,
        ),
      },
      cost: {
        value: String(r.cost),
        tone: tone(
          goals?.maxCost === undefined ? undefined : r.cost <= goals.maxCost,
        ),
      },
    };
  });

  protected readonly traffic = this.store.effectiveTraffic;
  protected readonly rpsPosition = computed(() =>
    sliderFromRps(this.traffic().rps),
  );
  protected readonly rpsText = computed(() => formatRps(this.traffic().rps));

  protected readonly selectedLoad = computed(() => {
    const r = this.store.selectedResult();
    if (!r || !Number.isFinite(r.capacity) || r.capacity === 0) return null;
    return `${Math.round(r.utilization * 100)}% load · ${formatRps(r.inRps)} of ${formatRps(r.capacity)}`;
  });

  constructor() {
    effect(() => {
      const id = this.challengeId();
      untracked(() => void this.store.open(id));
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.loopTimer !== null) clearTimeout(this.loopTimer);
    });
  }

  protected addable(kind: LabKind): boolean {
    return canAdd(this.store.design(), kind);
  }

  protected add(kind: LabKind): void {
    this.store.add(kind);
  }

  protected onNodeSelected(id: string): void {
    this.store.select(this.store.selectedId() === id ? null : id);
    this.connectChoice.set('');
  }

  protected stepInstances(delta: number): void {
    const n = this.store.selectedNode();
    if (n) this.store.setInstances(n.instances + delta);
  }

  protected onHitRatio(event: Event): void {
    this.store.setHitRatio(
      Number((event.target as HTMLInputElement).value) / 100,
    );
  }

  protected onConnectChoice(event: Event): void {
    this.connectChoice.set((event.target as HTMLSelectElement).value);
  }

  protected connect(): void {
    const to = this.connectChoice();
    if (!to) return;
    this.store.connectTo(to);
    this.connectChoice.set('');
  }

  protected toggleDown(): void {
    this.store.setDown(!this.store.selectedNode()?.down);
  }

  protected remove(): void {
    this.store.removeSelected();
    this.inspectorHeading()?.nativeElement.focus();
  }

  protected onRps(event: Event): void {
    this.store.setTraffic({
      rps: rpsFromSlider(Number((event.target as HTMLInputElement).value)),
    });
  }

  protected onRatio(event: Event, key: 'readRatio' | 'staticRatio'): void {
    this.store.setTraffic({
      [key]: Number((event.target as HTMLInputElement).value) / 100,
    });
  }

  /** Loops the packets while motion is allowed. */
  protected onPacketsDone(): void {
    if (this.reducedMotion() || this.store.scene().packets.length === 0) return;
    if (typeof Element.prototype.animate !== 'function') return;
    if (this.loopTimer !== null) clearTimeout(this.loopTimer);
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this.isoScene()?.replay();
    }, PACKET_LOOP_GAP_MS);
  }

  protected removeLabel(link: LabLinkView): string {
    return this.copy.removeLinkLabel(
      link.direction === 'to' ? this.copy.linkTo : this.copy.linkFrom,
      link.other,
    );
  }

  protected percent(x: number): number {
    return Math.round(x * 100);
  }
}
