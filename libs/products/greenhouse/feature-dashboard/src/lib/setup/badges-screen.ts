import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { GhButton, GREENHOUSE_BRAND } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { FarmStore } from '../store/farm.store';
import { badgeQr } from './badge-qr';
import { NO_TEAM } from './workers-screen';

/**
 * Printable worker badges: name, team, QR code and the code in clear for
 * typing when a camera fails. `?team=` limits them to one team.
 */
@Component({
  selector: 'gh-badges-screen',
  imports: [GhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badges-screen.html',
  styleUrls: ['../shared/screen.scss', './badges-screen.scss'],
})
export class BadgesScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly brand = inject(GREENHOUSE_BRAND);
  private readonly window = inject(DOCUMENT).defaultView;

  /** `?team=` from the workers screen's filter. */
  private readonly team = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((q) => q.get('team'))),
    { initialValue: null },
  );

  protected readonly badges = computed(() => {
    const team = this.team();
    const names = new Map(this.store.setup().teams.map((t) => [t.id, t.name]));
    return this.store
      .setup()
      .workers.filter(
        (w) =>
          w.active &&
          (!team || (team === NO_TEAM ? !w.teamId : w.teamId === team)),
      )
      .map((w) => ({
        worker: w,
        team: w.teamId ? (names.get(w.teamId) ?? '') : '',
        qr: badgeQr(w.badgeCode),
      }));
  });

  protected print(): void {
    this.window?.print();
  }
}
