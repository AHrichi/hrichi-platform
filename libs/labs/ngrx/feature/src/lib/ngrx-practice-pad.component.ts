import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgrxNavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'ah-ngrx-practice-pad',
  imports: [RouterOutlet, NgrxNavigationComponent],
  template: `
    <div class="ngrx-lab-shell">
      <ah-ngrx-navigation />

      <main class="lab-main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      color: var(--color-text-default);
      font-family: var(--font-family-sans, system-ui, sans-serif);
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .ngrx-lab-shell {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      min-height: 100%;
      box-sizing: border-box;
      position: relative;
      color: var(--color-text-default);
    }

    .lab-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxPracticePadComponent {}
