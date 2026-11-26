import type { TourPlacement } from './tour.model';

/** A box in the window, in CSS pixels (as `getBoundingClientRect` gives). */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Bands of the window the card must not cover: a floating header, a bottom bar. */
export interface Insets {
  readonly top: number;
  readonly bottom: number;
}

/** The side of its target the card ended up on, or how it shows without one. */
export type CardSide =
  | 'block-start'
  | 'block-end'
  | 'inline-start'
  | 'inline-end'
  | 'center'
  | 'sheet';

export interface PlacementRequest {
  /** The target's box, or null to centre the card. */
  readonly target: Box | null;
  readonly card: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly insets: Insets;
  readonly dir: 'ltr' | 'rtl';
  readonly preferred?: TourPlacement;
  /** Space between the target and the card. */
  readonly gap?: number;
  /** Space kept from the window's edges. */
  readonly margin?: number;
  /** Narrower than this, the card docks at the bottom as a sheet. */
  readonly sheetBelow?: number;
}

export interface Placement {
  readonly side: CardSide;
  /** The card's left and top, in the window. */
  readonly x: number;
  readonly y: number;
  /**
   * Where the card's pointer sits along the edge facing the target, from
   * that edge's start (left, or top for a card beside its target); null
   * without one.
   */
  readonly arrow: number | null;
}

const ARROW_INSET = 18;

/**
 * Where a step's card goes: next to its target on the side with room (the
 * preferred one first, then below, above, after, before), flipped for
 * right-to-left; centred without a target; docked at the bottom on a phone,
 * above any bottom bar, so it never covers the middle of the screen where
 * the target was scrolled to.
 */
export function placeCard(request: PlacementRequest): Placement {
  const {
    target,
    card,
    viewport,
    insets,
    dir,
    preferred = 'auto',
    gap = 12,
    margin = 12,
    sheetBelow = 768,
  } = request;

  if (viewport.width < sheetBelow) {
    return {
      side: 'sheet',
      x: margin,
      y: Math.max(
        insets.top + margin,
        viewport.height - insets.bottom - card.height - margin,
      ),
      arrow: null,
    };
  }

  const top = insets.top + margin;
  const bottom = viewport.height - insets.bottom - margin;
  if (!target) {
    return {
      side: 'center',
      x: Math.max(margin, (viewport.width - card.width) / 2),
      y: Math.max(top, (top + bottom - card.height) / 2),
      arrow: null,
    };
  }

  const centreX = target.x + target.width / 2;
  const centreY = target.y + target.height / 2;
  const clampX = (x: number) =>
    clamp(x, margin, viewport.width - card.width - margin);
  const clampY = (y: number) => clamp(y, top, bottom - card.height);
  // Inline sides are physical once the reading direction is known.
  const after = dir === 'rtl' ? 'left' : 'right';

  const tries: Record<
    Exclude<TourPlacement, 'auto'>,
    () => Placement | null
  > = {
    'block-end': () => {
      const y = target.y + target.height + gap;
      if (y + card.height > bottom) return null;
      const x = clampX(centreX - card.width / 2);
      return {
        side: 'block-end',
        x,
        y,
        arrow: arrowAt(centreX - x, card.width),
      };
    },
    'block-start': () => {
      const y = target.y - gap - card.height;
      if (y < top) return null;
      const x = clampX(centreX - card.width / 2);
      return {
        side: 'block-start',
        x,
        y,
        arrow: arrowAt(centreX - x, card.width),
      };
    },
    'inline-end': () =>
      beside(target, after === 'right' ? 'right' : 'left', 'inline-end'),
    'inline-start': () =>
      beside(target, after === 'right' ? 'left' : 'right', 'inline-start'),
  };

  function beside(
    box: Box,
    physical: 'left' | 'right',
    side: 'inline-start' | 'inline-end',
  ): Placement | null {
    const x =
      physical === 'right' ? box.x + box.width + gap : box.x - gap - card.width;
    if (x < margin || x + card.width > viewport.width - margin) return null;
    const y = clampY(centreY - card.height / 2);
    return { side, x, y, arrow: arrowAt(centreY - y, card.height) };
  }

  const order: Exclude<TourPlacement, 'auto'>[] = [
    'block-end',
    'block-start',
    'inline-end',
    'inline-start',
  ];
  const first = preferred === 'auto' ? [] : [preferred];
  for (const side of [...first, ...order.filter((s) => s !== preferred)]) {
    const placement = tries[side]();
    if (placement) return placement;
  }
  // No side has room (a target taller than the window): below it, kept on
  // screen, even if it overlaps.
  const x = clampX(centreX - card.width / 2);
  return {
    side: 'block-end',
    x,
    y: clampY(target.y + target.height + gap),
    arrow: arrowAt(centreX - x, card.width),
  };
}

function arrowAt(offset: number, length: number): number {
  return clamp(offset, ARROW_INSET, length - ARROW_INSET);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
