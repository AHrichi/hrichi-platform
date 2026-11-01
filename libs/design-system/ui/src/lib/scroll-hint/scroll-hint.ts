import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { isRtl } from '../direction';

const CHEVRON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Shows that a sideways-scrolling row (tabs, header links) has more in it.
 * The side with hidden items gets a fading edge and a chevron that scrolls
 * the row, which also serves mouse users who can't swipe. The first time an
 * overflowing row comes into view it nudges a little, unless the visitor
 * prefers reduced motion. Put it on a flex row with `overflow-x: auto`.
 *
 * The chevrons are sticky items inside the row, sized to cancel their own
 * width and the row's gap, so they never move the content. They are
 * aria-hidden and unfocusable: keyboard focus scrolls the row by itself.
 */
@Directive({
  selector: '[ahScrollHint]',
  host: { 'data-scroll-hint': '' },
})
export class ScrollHint {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    // Browser only: the cues are added after hydration, never prerendered.
    afterNextRender(() => {
      const view = host.ownerDocument.defaultView;
      // jsdom (unit tests) has no layout observers: nothing to hint there.
      if (
        !view ||
        !('ResizeObserver' in view) ||
        !('IntersectionObserver' in view)
      ) {
        return;
      }

      const cue = (side: 'start' | 'end') => {
        const button = host.ownerDocument.createElement('button');
        button.type = 'button';
        button.tabIndex = -1;
        button.className = `ah-scroll-cue ah-scroll-cue--${side}`;
        button.setAttribute('aria-hidden', 'true');
        button.innerHTML = CHEVRON;
        button.addEventListener('click', () => scroll(side));
        return button;
      };
      const start = cue('start');
      const end = cue('end');
      host.prepend(start);
      host.append(end);

      const towardEnd = () => (isRtl(host) ? -1 : 1);
      const scroll = (side: 'start' | 'end') =>
        host.scrollBy({
          left:
            (side === 'end' ? 1 : -1) * towardEnd() * host.clientWidth * 0.7,
          behavior: reducedMotion() ? 'auto' : 'smooth',
        });
      const reducedMotion = () =>
        view.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let frame = 0;
      const update = () => {
        frame = 0;
        const gap = parseFloat(view.getComputedStyle(host).columnGap) || 0;
        host.style.setProperty('--ah-scroll-gap', `${gap}px`);
        // scrollLeft runs negative in right-to-left rows.
        const position = Math.abs(host.scrollLeft);
        const room = host.scrollWidth - host.clientWidth;
        host.toggleAttribute('data-overflow-start', position > 1);
        host.toggleAttribute('data-overflow-end', room - position > 1);
      };
      const schedule = () => {
        frame ||= view.requestAnimationFrame(update);
      };

      host.addEventListener('scroll', schedule, { passive: true });
      const resize = new ResizeObserver(schedule);
      resize.observe(host);
      const mutations = new MutationObserver(schedule);
      mutations.observe(host, { childList: true, subtree: true });

      // One nudge, the first time the row is seen with items out of view.
      let nudged = false;
      const seen = new IntersectionObserver((entries) => {
        if (nudged || !entries.some((e) => e.isIntersecting)) return;
        update();
        if (!host.hasAttribute('data-overflow-end') || reducedMotion()) return;
        nudged = true;
        seen.disconnect();
        const from = host.scrollLeft;
        let touched = false;
        const touch = () => (touched = true);
        for (const type of ['pointerdown', 'wheel', 'keydown'] as const) {
          host.addEventListener(type, touch, { once: true, passive: true });
        }
        host.scrollTo({ left: from + 40 * towardEnd(), behavior: 'smooth' });
        view.setTimeout(() => {
          if (!touched) host.scrollTo({ left: from, behavior: 'smooth' });
        }, 450);
        // Smooth scrolls stall in a hidden tab: make sure the row ends where it began.
        view.setTimeout(() => {
          if (!touched) host.scrollLeft = from;
        }, 1200);
      });
      seen.observe(host);
      schedule();

      destroyRef.onDestroy(() => {
        host.removeEventListener('scroll', schedule);
        resize.disconnect();
        mutations.disconnect();
        seen.disconnect();
        if (frame) view.cancelAnimationFrame(frame);
        start.remove();
        end.remove();
      });
    });
  }
}
