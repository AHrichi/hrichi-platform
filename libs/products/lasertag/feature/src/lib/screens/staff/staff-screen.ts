import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  type GuestCreated,
  mapSize,
  type RecoveryIssued,
} from '@ah/products/lasertag/domain';
import { AhAlert, AhButton, AhSegmentedControl } from '@ah/ui';
import { BarqI18n } from '../../i18n/barq-i18n';
import { VenueDesk } from '../../state/venue-desk';
import { QrCode } from '../../ui/qr-code';
import { ScanField } from '../../ui/scan-field';

type Who = 'player' | 'guest';

/**
 * The counter: open a session, check players in with their badge (or a new
 * guest) and a vest, release gear, close the session, and make recovery
 * codes. Two steps per check-in, each by scan or by typing.
 */
@Component({
  selector: 'lt-staff-screen',
  imports: [
    AhAlert,
    AhButton,
    AhSegmentedControl,
    QrCode,
    RouterLink,
    ScanField,
  ],
  providers: [VenueDesk],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-screen.html',
  styleUrls: ['../screen.scss', './staff-screen.scss'],
})
export class StaffScreen {
  protected readonly i18n = inject(BarqI18n);
  protected readonly desk = inject(VenueDesk);

  protected readonly claimCode = signal('');
  protected readonly who = signal<Who>('player');
  protected readonly whoOptions = computed(() => [
    { value: 'player' as const, label: this.i18n.t().staff.whoPlayer },
    { value: 'guest' as const, label: this.i18n.t().staff.whoGuest },
  ]);
  protected readonly badge = signal('');
  protected readonly nickname = signal('');
  protected readonly guest = signal<GuestCreated | null>(null);
  protected readonly gear = signal('');
  protected readonly lastCheckIn = signal<string | null>(null);
  protected readonly recoveryHandle = signal('');
  protected readonly recovery = signal<RecoveryIssued | null>(null);

  protected readonly map = computed(() => this.desk.venue()?.maps[0] ?? null);
  protected readonly size = computed(() => {
    const map = this.map();
    return map ? mapSize(map) : null;
  });

  /** Where the guest's QR sends them: the claim page, code filled in. */
  protected readonly guestLink = computed(() => {
    const guest = this.guest();
    if (!guest) return '';
    const base = globalThis.document?.baseURI ?? 'http://localhost/';
    return new URL(`claim#code=${guest.claimCode}`, base).toString();
  });

  /** The words for the desk's last failure. */
  protected readonly problemText = computed(() => {
    const problem = this.desk.problem();
    if (!problem) return null;
    const refused = this.i18n.t().staff.refused as Record<string, string>;
    return problem.code === 'CHECKIN_REFUSED' && problem.detail
      ? (refused[problem.detail] ?? this.i18n.error(problem.code))
      : this.i18n.error(problem.code);
  });

  constructor() {
    void this.desk.load();
  }

  protected claim(event: Event): void {
    event.preventDefault();
    void this.desk.claimVenue(this.claimCode());
  }

  protected setWho(who: Who): void {
    this.who.set(who);
    this.guest.set(null);
  }

  protected async makeGuest(event: Event): Promise<void> {
    event.preventDefault();
    this.guest.set(await this.desk.createGuest(this.nickname()));
  }

  protected async checkIn(sessionId: string): Promise<void> {
    const guest = this.guest();
    const who =
      this.who() === 'guest'
        ? guest
          ? { guestId: guest.guest.id }
          : null
        : this.badge().trim()
          ? { badge: this.badge().trim() }
          : null;
    if (!who || !this.gear().trim()) return;
    const ok = await this.desk.checkIn(sessionId, who, this.gear().trim());
    if (!ok) return;
    const entry = this.desk.current()?.roster.at(-1);
    this.lastCheckIn.set(
      entry
        ? this.i18n
            .t()
            .staff.checkedIn(
              this.i18n.ltr(entry.name),
              this.i18n.ltr(entry.vest),
            )
        : null,
    );
    this.badge.set('');
    this.gear.set('');
    this.nickname.set('');
    this.guest.set(null);
  }

  protected close(sessionId: string): void {
    if (globalThis.confirm?.(this.i18n.t().staff.closeConfirm) ?? true) {
      void this.desk.closeSession(sessionId);
    }
  }

  protected async issueRecovery(event: Event): Promise<void> {
    event.preventDefault();
    this.recovery.set(await this.desk.issueRecovery(this.recoveryHandle()));
  }
}
