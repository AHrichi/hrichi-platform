import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type CheckStatus, checkStatus } from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { FieldI18n } from '../../i18n/field-i18n';
import { FieldStore } from '../../store/field.store';

/** Today, the greenhouses to log work in, and their hygiene checks. */
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

  protected hygieneOf(greenhouseId: string): CheckStatus {
    return checkStatus(this.store.checksByGreenhouse().get(greenhouseId));
  }

  protected entriesIn(greenhouseId: string): number {
    return this.store.logsByGreenhouse().get(greenhouseId)?.length ?? 0;
  }
}
