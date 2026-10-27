import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-tooltip',
  standalone: true,
  template: `
    <span class="tip-wrap">
      <ng-content />
      <span class="tip-icon">ⓘ</span>
      <div class="tip-box">
        <div class="tip-arrow"></div>
        @if (tipTitle()) {
          <div class="tip-title">{{ tipTitle() }}</div>
        }
        <div class="tip-body">{{ tipBody() }}</div>
        @if (tipFormula()) {
          <div class="tip-formula">
            <strong>Formula:</strong> {{ tipFormula() }}
          </div>
        }
        @if (tipMeaning()) {
          <div class="tip-meaning">
            <strong>What it means:</strong> {{ tipMeaning() }}
          </div>
        }
      </div>
    </span>
  `,
  styles: [
    `
      .tip-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        cursor: help;
        white-space: nowrap;
      }
      .tip-icon {
        font-size: 12px;
        opacity: 0.4;
        transition: opacity 0.2s;
        line-height: 1;
      }
      .tip-wrap:hover .tip-icon {
        opacity: 0.85;
      }
      .tip-box {
        display: none;
        position: absolute;
        bottom: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface, #fff);
        border: 1px solid var(--border-light, #e2e8f0);
        border-radius: 12px;
        padding: 14px 16px;
        width: 270px;
        font-size: 0.78rem;
        line-height: 1.55;
        color: var(--text-main, #1e293b);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        z-index: 9999;
        white-space: normal;
        pointer-events: none;
      }
      .tip-wrap:hover .tip-box {
        display: block;
      }
      .tip-arrow {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 10px;
        height: 10px;
        background: var(--surface, #fff);
        border-right: 1px solid var(--border-light, #e2e8f0);
        border-bottom: 1px solid var(--border-light, #e2e8f0);
      }
      .tip-title {
        font-weight: 700;
        margin-bottom: 6px;
        font-size: 0.85rem;
      }
      .tip-body {
        color: var(--text-muted, #64748b);
        margin-bottom: 6px;
      }
      .tip-formula,
      .tip-meaning {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid var(--border-light, #e2e8f0);
        font-size: 0.73rem;
        color: var(--text-muted, #64748b);
      }
    `,
  ],
})
export class UiTooltipComponent {
  tipTitle = input<string>('');
  tipBody = input<string>('');
  tipFormula = input<string>('');
  tipMeaning = input<string>('');
}
