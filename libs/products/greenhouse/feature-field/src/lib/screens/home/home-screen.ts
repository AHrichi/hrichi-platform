import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  type CheckStatus,
  checkStatus,
  cleanJoinCode,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { FieldI18n } from '../../i18n/field-i18n';
import { FieldStore } from '../../store/field.store';

/**
 * Today, the greenhouses to log work in, and their hygiene checks. On no
 * farm yet, the manager's join code.
 */
@Component({
  selector: 'gh-home-screen',
  imports: [GhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-screen.html',
  styleUrl: './home-screen.scss',
})
export class HomeScreen {
  protected readonly store = inject(FieldStore);
  protected readonly i18n = inject(FieldI18n);
  protected readonly t = this.i18n.t;
  protected readonly joining = signal(false);
  protected readonly joinProblem = signal<
    'joinRequired' | 'joinInvalid' | 'joinOffline' | 'joinFailed' | null
  >(null);

  protected async join(text: string): Promise<void> {
    if (this.joining()) return;
    const code = cleanJoinCode(text);
    this.joinProblem.set(code ? null : 'joinRequired');
    if (!code) return;
    this.joining.set(true);
    try {
      const result = await this.store.joinFarm(code);
      this.joinProblem.set(
        result === 'invalid'
          ? 'joinInvalid'
          : result === 'offline'
            ? 'joinOffline'
            : result === 'failed'
              ? 'joinFailed'
              : null,
      );
    } finally {
      this.joining.set(false);
    }
  }

  protected hygieneOf(greenhouseId: string): CheckStatus {
    return checkStatus(this.store.checksByGreenhouse().get(greenhouseId));
  }

  protected entriesIn(greenhouseId: string): number {
    return this.store.logsByGreenhouse().get(greenhouseId)?.length ?? 0;
  }
}
