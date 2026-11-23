import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { FarmStore } from '../store/farm.store';

/** Signed in, on no farm: make one (or sign out and wait for an invite). */
@Component({
  selector: 'gh-create-farm',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let tf = t().farm;
    <form
      class="gh-card card"
      aria-labelledby="gh-farm-title"
      (submit)="$event.preventDefault(); submit(nameBox.value, youBox.value)"
    >
      <h1 id="gh-farm-title" class="title">{{ tf.title }}</h1>
      <p class="intro">{{ tf.intro }}</p>
      @if (store.account(); as account) {
        <p class="intro">
          {{ i18n.fill(t().app.signedInAs, { email: account.email }) }}
        </p>
      }

      <label class="gh-label" for="gh-farm-name">{{ tf.name }}</label>
      <input
        #nameBox
        id="gh-farm-name"
        class="gh-input"
        name="farm"
        maxlength="120"
        required
      />
      <label class="gh-label" for="gh-farm-you">{{ tf.you }}</label>
      <input
        #youBox
        id="gh-farm-you"
        class="gh-input"
        name="name"
        autocomplete="name"
        maxlength="120"
        required
      />

      <button type="submit" ghButton block [disabled]="busy()">
        {{ busy() ? t().auth.busy : tf.submit }}
      </button>
      <p class="switch">
        <button type="button" ghButton="ghost" (click)="store.signOut()">
          {{ t().app.signOut }}
        </button>
      </p>
    </form>
  `,
  styleUrl: './auth.scss',
})
export class CreateFarm {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly busy = signal(false);

  protected async submit(farmName: string, you: string): Promise<void> {
    if (this.busy() || !farmName.trim() || !you.trim()) return;
    this.busy.set(true);
    try {
      await this.store.createFarm(farmName.trim(), you.trim());
    } finally {
      this.busy.set(false);
    }
  }
}
