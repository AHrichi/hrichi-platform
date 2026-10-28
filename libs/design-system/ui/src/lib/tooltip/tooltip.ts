import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

let nextTooltipId = 0;

export type TooltipPosition = 'top' | 'bottom';

/**
 * Accessible concept & metric tooltip explaining formulas, terms, and meanings.
 * Keyboard accessible via Tab focus with full ARIA tooltip binding.
 */
@Component({
  selector: 'ah-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-tooltip-host',
    '[class.ah-tooltip--bottom]': "position() === 'bottom'",
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
  },
  template: `
    <span
      class="ah-tooltip-trigger"
      tabindex="0"
      [attr.aria-describedby]="tooltipId"
      (keydown.escape)="hide()"
    >
      <ng-content />
      <span class="ah-tooltip-icon" aria-hidden="true">ⓘ</span>
    </span>

    @if (isOpen()) {
      <div
        class="ah-tooltip-box"
        role="tooltip"
        [id]="tooltipId"
        [class.ah-tooltip-box--bottom]="position() === 'bottom'"
      >
        <div class="ah-tooltip-arrow" aria-hidden="true"></div>
        @if (title()) {
          <div class="ah-tooltip-title">{{ title() }}</div>
        }
        <div class="ah-tooltip-body">{{ body() }}</div>
        @if (formula()) {
          <div class="ah-tooltip-formula">
            <span class="ah-tooltip-prop-label">Formula:</span> {{ formula() }}
          </div>
        }
        @if (meaning()) {
          <div class="ah-tooltip-meaning">
            <span class="ah-tooltip-prop-label">Meaning:</span> {{ meaning() }}
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      vertical-align: baseline;
    }

    .ah-tooltip-trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      cursor: help;
      text-decoration: underline dotted var(--color-border-strong);
      text-underline-offset: 2px;
      outline: none;
      border-radius: var(--radius-sm);
      transition: color var(--motion-duration-fast) ease;
    }

    .ah-tooltip-trigger:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }

    .ah-tooltip-icon {
      font-size: 0.85em;
      opacity: 0.65;
      transition: opacity var(--motion-duration-fast) ease;
      color: var(--color-text-muted);
    }

    .ah-tooltip-trigger:hover .ah-tooltip-icon,
    .ah-tooltip-trigger:focus-visible .ah-tooltip-icon {
      opacity: 1;
      color: var(--color-accent-default);
    }

    .ah-tooltip-box {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      inline-size: max-content;
      max-inline-size: 18rem;
      padding: var(--space-3);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-raised);
      color: var(--color-text-default);
      font-size: var(--font-size-100);
      line-height: var(--font-line-height-normal);
      pointer-events: none;
      white-space: normal;
      animation: ah-tooltip-in var(--motion-duration-fast)
        var(--motion-easing-standard);
    }

    .ah-tooltip-box--bottom {
      bottom: auto;
      top: calc(100% + 8px);
    }

    .ah-tooltip-arrow {
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      inline-size: 8px;
      block-size: 8px;
      background: var(--color-bg-raised);
      border-right: 1px solid var(--color-border-default);
      border-bottom: 1px solid var(--color-border-default);
    }

    .ah-tooltip-box--bottom .ah-tooltip-arrow {
      bottom: auto;
      top: -5px;
      border-right: none;
      border-bottom: none;
      border-left: 1px solid var(--color-border-default);
      border-top: 1px solid var(--color-border-default);
    }

    .ah-tooltip-title {
      font-weight: var(--font-weight-bold);
      color: var(--color-text-default);
      margin-block-end: var(--space-1);
    }

    .ah-tooltip-body {
      color: var(--color-text-muted);
    }

    .ah-tooltip-formula,
    .ah-tooltip-meaning {
      margin-block-start: var(--space-2);
      padding-block-start: var(--space-2);
      border-block-start: 1px solid var(--color-border-default);
      font-size: 0.85em;
      color: var(--color-text-muted);
    }

    .ah-tooltip-prop-label {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-default);
    }

    @keyframes ah-tooltip-in {
      from {
        opacity: 0;
        transform: translate(-50%, 4px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
  `,
})
export class Tooltip {
  readonly title = input<string>();
  readonly body = input.required<string>();
  readonly formula = input<string>();
  readonly meaning = input<string>();
  readonly position = input<TooltipPosition>('top');

  protected readonly tooltipId = `ah-tooltip-${++nextTooltipId}`;
  protected readonly isOpen = signal<boolean>(false);

  show(): void {
    this.isOpen.set(true);
  }

  hide(): void {
    this.isOpen.set(false);
  }
}
