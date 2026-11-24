import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { cleanJoinCode } from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { FarmStore } from '../store/farm.store';

/** Signed in, on no farm: join one with a manager's code, or make one. */
@Component({
  selector: 'gh-create-farm',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let tf = t().farm;
    <div class="gh-card card">
      <h1 id="gh-farm-title" class="title">{{ tf.title }}</h1>
      <p class="intro">{{ tf.intro }}</p>
      @if (store.account(); as account) {
        <p class="intro">
          {{ i18n.fill(t().app.signedInAs, { email: account.email }) }}
        </p>
      }

      <form
        class="stack"
        novalidate
        aria-labelledby="gh-join-title"
        (submit)="$event.preventDefault(); join(codeBox.value)"
      >
        <h2 id="gh-join-title" class="subtitle">{{ tf.joinTitle }}</h2>
        <label class="gh-label" for="gh-join-code">{{ tf.joinCode }}</label>
        <input
          #codeBox
          id="gh-join-code"
          class="gh-input code"
          name="code"
          dir="ltr"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="12"
          placeholder="K7QX-M2PD"
          [attr.aria-invalid]="joinProblem() ? true : null"
          [attr.aria-describedby]="joinProblem() ? 'gh-join-error' : null"
        />
        @if (joinProblem(); as problem) {
          <p id="gh-join-error" class="gh-error">{{ tf[problem] }}</p>
        }
        <button type="submit" ghButton block [disabled]="busy()">
          {{ busy() ? t().auth.busy : tf.joinSubmit }}
        </button>
      </form>

      <form
        class="stack"
        aria-labelledby="gh-create-title"
        (submit)="$event.preventDefault(); create(nameBox.value, youBox.value)"
      >
        <h2 id="gh-create-title" class="subtitle">{{ tf.createTitle }}</h2>
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
        <button type="submit" ghButton="secondary" block [disabled]="busy()">
          {{ busy() ? t().auth.busy : tf.submit }}
        </button>
      </form>

      <p class="switch">
        <button type="button" ghButton="ghost" (click)="store.signOut()">
          {{ t().app.signOut }}
        </button>
      </p>
    </div>
  `,
  styleUrl: './auth.scss',
})
export class CreateFarm {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly busy = signal(false);

  /** Why the code was refused: a key of the farm copy. */
  protected readonly joinProblem = signal<
    'joinRequired' | 'joinInvalid' | null
  >(null);

  protected async join(text: string): Promise<void> {
    if (this.busy()) return;
    const code = cleanJoinCode(text);
    this.joinProblem.set(code ? null : 'joinRequired');
    if (!code) return;
    this.busy.set(true);
    try {
      const result = await this.store.joinFarm(code);
      if (result === 'invalid') this.joinProblem.set('joinInvalid');
    } finally {
      this.busy.set(false);
    }
  }

  protected async create(farmName: string, you: string): Promise<void> {
    if (this.busy() || !farmName.trim() || !you.trim()) return;
    this.busy.set(true);
    try {
      await this.store.createFarm(farmName.trim(), you.trim());
    } finally {
      this.busy.set(false);
    }
  }
}
