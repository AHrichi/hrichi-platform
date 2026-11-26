import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Coachmark, injectReducedMotion } from '@ah/ui';
import { type Box, type Insets, placeCard, type Placement } from './placement';
import { waitForTarget } from './target-locator';
import { tourCopy } from './tour-copy';
import type { TourRoute, TourStepText } from './tour.model';
import { TourService } from './tour.service';

/** Room between the target and the ring drawn round it. */
const RING_PAD = 6;
/** Long enough for a smooth scroll to land. */
const SCROLL_SETTLE_MS = 420;

const NO_INSETS: () => Insets = () => ({ top: 0, bottom: 0 });

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shows the running tour (`TourService`): a ring round the step's target,
 * the rest of the page dimmed, and a `<ah-coachmark>` beside it. Both sit
 * in a `popover="manual"` layer, so they are above every header, sheet and
 * menu (the top layer) and nothing closes them by accident.
 *
 * The page stays usable: the layer lets clicks through, and the card is a
 * non-modal dialog. Each step opens its screen (`navigate`), waits for its
 * target, scrolls it into view (no smooth scroll with reduced motion),
 * places the card where there is room (`placeCard`) and moves focus to it;
 * the tour gives focus back to whatever started it. Without a target, the
 * card shows in the middle of the dimmed screen.
 *
 * The app passes the words (`text`, by step id), its language and reading
 * direction, the element its targets live in (`root`; the whole page when
 * unset), the bands to keep clear (`insets`: a floating header, a phone's
 * bottom bar) and how to open a screen (`navigate`).
 */
@Component({
  selector: 'ah-tour-host',
  imports: [Coachmark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-host.html',
  styleUrl: './tour-host.scss',
  host: {
    '(window:resize)': 'schedule()',
  },
})
export class TourHost {
  readonly text = input.required<(stepId: string) => TourStepText>();
  readonly lang = input('en');
  readonly dir = input<'ltr' | 'rtl'>('ltr');
  readonly root = input<HTMLElement | null>(null);
  readonly insets = input<() => Insets>(NO_INSETS);
  readonly navigate = input<((route: TourRoute) => Promise<unknown>) | null>(
    null,
  );

  protected readonly tour = inject(TourService);
  private readonly reduced = injectReducedMotion();
  private readonly layer = viewChild.required<ElementRef<HTMLElement>>('layer');
  private readonly cardRef = viewChild('card', { read: ElementRef });

  protected readonly index = computed(() => this.tour.active()?.index ?? 0);
  protected readonly total = computed(
    () => this.tour.active()?.definition.steps.length ?? 0,
  );
  protected readonly copy = computed(() => tourCopy(this.lang()));
  protected readonly labels = computed(() => {
    const copy = this.copy();
    return {
      next: copy.next,
      back: copy.back,
      finish: copy.finish,
      close: copy.close,
    };
  });
  protected readonly words = computed<TourStepText>(() => {
    const step = this.tour.step();
    return step ? this.text()(step.id) : { title: '', body: '' };
  });

  /** The ring's box, or null to dim the whole screen. */
  protected readonly ring = signal<Box | null>(null);
  protected readonly spot = signal<Placement>({
    side: 'center',
    x: 0,
    y: 0,
    arrow: null,
  });
  /** False while a step is being measured: the card is laid out, unseen. */
  protected readonly placed = signal(false);

  private target: HTMLElement | null = null;
  private run: AbortController | null = null;
  private frame = 0;
  private resizes: ResizeObserver | null = null;
  private readonly onScroll = () => this.schedule();

  constructor() {
    effect(() => {
      const active = this.tour.active();
      untracked(() => void this.show(active !== null));
    });
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.run?.abort();
      this.unwatch();
      cancelAnimationFrame(this.frame);
    });
  }

  private cardElement(): HTMLElement | undefined {
    return this.cardRef()?.nativeElement as HTMLElement | undefined;
  }

  /** Measures again on the next frame (scroll, resize, a target that moved). */
  protected schedule(): void {
    if (!this.tour.active()) return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.measure());
  }

  private async show(open: boolean): Promise<void> {
    this.run?.abort();
    const run = (this.run = new AbortController());
    const layer = this.layer().nativeElement;
    this.placed.set(false);
    this.unwatch();
    if (!open) {
      const last = this.target;
      this.target = null;
      if (isOpen(layer)) layer.hidePopover?.();
      // The tour ended with nothing to give focus back to (it was started
      // from a button that has since gone): the last step's target, when
      // it can take focus, rather than the top of the page.
      const focused = document.activeElement;
      const lost =
        !focused || focused === document.body || layer.contains(focused);
      if (lost && last?.isConnected && last.matches(FOCUSABLE)) {
        last.focus({ preventScroll: true });
      }
      return;
    }
    const step = this.tour.step();
    if (!step) return;
    if (!isOpen(layer)) layer.showPopover?.();
    if (step.route) {
      await this.navigate()?.(step.route);
      if (run.signal.aborted) return;
    }
    const target = await waitForTarget(
      this.root() ?? document.body,
      step.targets,
      1500,
      run.signal,
    );
    if (run.signal.aborted) return;
    this.target = target;
    if (target) {
      target.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: this.reduced() ? 'auto' : 'smooth',
      });
      await wait(this.reduced() ? 0 : SCROLL_SETTLE_MS);
      if (run.signal.aborted) return;
    }
    this.watch(target);
    // A phone's sheet is wider than a card: set the side before measuring.
    this.spot.set({
      side: this.sheet() ? 'sheet' : 'center',
      x: 0,
      y: 0,
      arrow: null,
    });
    await nextFrame();
    if (run.signal.aborted) return;
    this.measure();
    this.placed.set(true);
    this.cardElement()?.focus({ preventScroll: true });
  }

  private measure(): void {
    const card = this.cardElement();
    const step = this.tour.step();
    if (!card || !step) return;
    const box = this.target?.isConnected
      ? this.target.getBoundingClientRect()
      : null;
    const target =
      box && (box.width > 0 || box.height > 0)
        ? {
            x: box.x - RING_PAD,
            y: box.y - RING_PAD,
            width: box.width + 2 * RING_PAD,
            height: box.height + 2 * RING_PAD,
          }
        : null;
    this.ring.set(target);
    const dir = this.dir();
    const placement = placeCard({
      target,
      card: { width: card.offsetWidth, height: card.offsetHeight },
      viewport: {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
      },
      insets: this.insets()(),
      dir,
      preferred: step.placement,
    });
    // The pointer is placed from the card's reading start.
    const along =
      placement.arrow !== null &&
      dir === 'rtl' &&
      (placement.side === 'block-start' || placement.side === 'block-end')
        ? card.offsetWidth - placement.arrow
        : placement.arrow;
    this.spot.set({ ...placement, arrow: along });
  }

  private sheet(): boolean {
    return document.documentElement.clientWidth < 768;
  }

  private watch(target: HTMLElement | null): void {
    window.addEventListener('scroll', this.onScroll, {
      capture: true,
      passive: true,
    });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizes = new ResizeObserver(() => this.schedule());
      if (target) this.resizes.observe(target);
      const card = this.cardElement();
      if (card) this.resizes.observe(card);
    }
  }

  private unwatch(): void {
    window.removeEventListener('scroll', this.onScroll, { capture: true });
    this.resizes?.disconnect();
    this.resizes = null;
  }
}

/** Whether a popover shows; false where the browser has no popovers. */
function isOpen(element: HTMLElement): boolean {
  try {
    return element.matches(':popover-open');
  } catch {
    return false;
  }
}

function wait(ms: number): Promise<void> {
  return ms > 0
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();
}

/**
 * After the next frame, so layout is current. A tab in the background gets
 * no frames, so a short timer stands in: the step still settles there.
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, 100);
    const frame = requestAnimationFrame(done);
    function done() {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      resolve();
    }
  });
}
