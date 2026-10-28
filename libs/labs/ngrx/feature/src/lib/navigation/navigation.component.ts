import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'ah-ngrx-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sub-nav" aria-label="NgRx lab modules">
      <div class="links-group">
        <a routerLink="store-flow" routerLinkActive="active" class="nav-tab">
          Store Flow &amp; Time-Travel
        </a>
        <a routerLink="signal-store" routerLinkActive="active" class="nav-tab">
          SignalStore &amp; Entities
        </a>
        <a routerLink="effects-cycle" routerLinkActive="active" class="nav-tab">
          Effects &amp; Async
        </a>
        <a
          routerLink="ngrx-vs-services"
          routerLinkActive="active"
          class="nav-tab highlight"
        >
          NgRx vs Services Guide
        </a>
      </div>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 100%;
      min-inline-size: 0;
    }

    .sub-nav {
      display: flex;
      align-items: center;
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      margin-bottom: var(--space-6, 1.5rem);
      max-inline-size: 100%;
      min-inline-size: 0;
      box-sizing: border-box;
    }

    .links-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1, 0.25rem);
      max-inline-size: 100%;
      min-inline-size: 0;
    }

    .nav-tab {
      display: inline-flex;
      align-items: center;
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border-radius: var(--radius-pill);
      font-size: var(--font-size-100, 0.8125rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted);
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      transition:
        background-color var(--motion-duration-fast)
          var(--motion-easing-standard),
        color var(--motion-duration-fast) var(--motion-easing-standard);
    }

    .nav-tab:hover {
      color: var(--color-text-default);
      background: var(--color-bg-raised);
    }

    .nav-tab.active {
      background: var(--color-accent-default);
      color: var(--color-accent-on);
    }

    .nav-tab.highlight.active {
      background: var(--color-accent-default);
      color: var(--color-accent-on);
    }

    @media (max-width: 768px) {
      .sub-nav {
        padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
        margin-bottom: var(--space-4, 1rem);
      }

      .links-group {
        overflow-x: auto;
        flex-wrap: nowrap;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding-bottom: 2px;
        width: 100%;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .nav-tab {
        white-space: nowrap;
        flex-shrink: 0;
        font-size: 0.75rem;
        padding: 6px 10px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxNavigationComponent {}
