import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AhButton } from '@ah/ui';

@Component({
  selector: 'ah-ngrx-navigation',
  imports: [RouterLink, RouterLinkActive, AhButton],
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

      <div class="controls-group">
        <button
          type="button"
          ahButton="ghost"
          size="sm"
          (click)="toggleFullscreen.emit()"
          [attr.aria-label]="
            isFullscreen() ? 'Exit Full Screen' : 'Enter Full Screen'
          "
        >
          {{ isFullscreen() ? '⤢ Exit Full Screen' : '⤢ Full Screen' }}
        </button>
      </div>
    </nav>
  `,
  styles: `
    .sub-nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
      background: var(--color-surface-raised, rgba(30, 41, 59, 0.5));
      border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: var(--radius-xl, 1rem);
      margin-bottom: var(--space-6, 1.5rem);
    }

    .links-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1, 0.25rem);
    }

    .nav-tab {
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border-radius: var(--radius-md, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-muted, #94a3b8);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .nav-tab:hover {
      color: var(--color-text-primary, #f8fafc);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-tab.active {
      background: #6366f1;
      color: #ffffff;
    }

    .nav-tab.highlight.active {
      background: linear-gradient(135deg, #6366f1, #3b82f6);
    }

    .controls-group {
      display: flex;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxNavigationComponent {
  readonly isFullscreen = input<boolean>(false);
  readonly toggleFullscreen = output<void>();
}
