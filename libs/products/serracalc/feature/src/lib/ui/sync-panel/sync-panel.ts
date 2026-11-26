import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { APP_MODE } from '@ah/platform/app-mode';
import { deviceKind, SyncEngine } from '@ah/platform/sync';
import type { SyncDevice } from '@ah/shared/sync';
import { AhButton } from '@ah/ui';
import { SerraI18n } from '../../i18n/serra-i18n';

/**
 * Opt-in cloud sync, on the Projects screen (ADR-0032). Off: what it does
 * and where the data goes, then "Turn on" or "I have a code". On: where it
 * stands, Sync now, a code to link another device (with a countdown and a
 * link to copy), the linked devices, and the ways out: off on this device,
 * or the cloud copy deleted. A link from another device (`#link=CODE`)
 * opens the code form, filled in, and waits for the reader to confirm.
 * Inside the portfolio's demo it only says sync works in the app.
 */
@Component({
  selector: 'sc-sync-panel',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sync-panel.html',
  styleUrl: './sync-panel.scss',
})
export class SyncPanel {
  protected readonly sync = inject(SyncEngine);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly name = signal('');
  protected readonly joining = signal(false);
  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pairing = signal<{
    code: string;
    expiresAt: string;
  } | null>(null);
  protected readonly copied = signal(false);
  protected readonly devices = signal<readonly SyncDevice[] | null>(null);
  private readonly now = signal(Date.now());
  private readonly codeInput =
    viewChild<ElementRef<HTMLInputElement>>('codeInput');

  /** The code's time left, in milliseconds. */
  protected readonly remaining = computed(() => {
    const pairing = this.pairing();
    return pairing
      ? Math.max(0, Date.parse(pairing.expiresAt) - this.now())
      : 0;
  });
  protected readonly remainingText = computed(() => {
    const seconds = Math.ceil(this.remaining() / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  protected readonly statusText = computed(() => {
    const s = this.t().sync;
    switch (this.sync.status()) {
      case 'syncing':
        return s.syncing;
      case 'offline':
        return s.offline;
      case 'waiting':
        return s.waiting;
      case 'unavailable':
        return s.unavailable;
      case 'attention':
        return this.sync.problem() === 'clock'
          ? s.clock
          : this.sync.problem() === 'full'
            ? s.full
            : s.tooLarge;
      default: {
        const at = this.sync.lastSyncAt();
        return at ? s.synced(this.when(at)) : s.never;
      }
    }
  });

  protected readonly usageText = computed(() => {
    const usage = this.sync.usage();
    return usage
      ? this.t().sync.usage(this.size(usage.bytes), this.size(usage.maxBytes))
      : null;
  });

  constructor() {
    // The default name, in the reader's language, until they change it.
    effect(() => {
      const named = this.t().sync.kinds[deviceKind()];
      untracked(() => {
        if (!this.name() || this.isDefaultName(this.name()))
          this.name.set(named);
      });
    });
    effect(() => {
      if (this.sync.on()) untracked(() => void this.loadDevices());
      else this.devices.set(null);
    });
    const tick = setInterval(() => {
      if (this.pairing()) this.now.set(Date.now());
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));

    // A link from another device: fill the code in, and let the reader
    // confirm (a link alone never joins a space).
    afterNextRender(() => {
      const location = this.document.defaultView?.location;
      const match = /^#link=([0-9A-Za-z]{4}-?[0-9A-Za-z]{4})$/.exec(
        location?.hash ?? '',
      );
      if (!match || !location || !this.standalone || this.sync.on()) return;
      this.code.set(match[1].toUpperCase());
      this.joining.set(true);
      this.document.defaultView?.history.replaceState(
        null,
        '',
        location.pathname + location.search,
      );
      setTimeout(() => {
        (this.host.nativeElement as HTMLElement).scrollIntoView({
          block: 'center',
        });
        this.codeInput()?.nativeElement.focus();
      });
    });
  }

  protected startJoin(): void {
    this.error.set(null);
    this.joining.set(true);
    setTimeout(() => this.codeInput()?.nativeElement.focus());
  }

  protected async turnOn(): Promise<void> {
    await this.run(() => this.sync.turnOn(this.deviceName()));
  }

  protected async join(): Promise<void> {
    const joined = await this.run(() =>
      this.sync.join(this.code(), this.deviceName()),
    );
    if (joined) {
      this.joining.set(false);
      this.code.set('');
    }
  }

  protected async link(): Promise<void> {
    this.copied.set(false);
    const reply = await this.sync.linkCode();
    if (reply.ok) {
      this.now.set(Date.now());
      this.pairing.set({ code: reply.code, expiresAt: reply.expiresAt });
      this.error.set(null);
    } else {
      this.error.set(this.errorText(reply.code));
    }
  }

  protected async copyLink(): Promise<void> {
    const pairing = this.pairing();
    if (!pairing) return;
    const url = new URL('projects', this.document.baseURI);
    url.hash = `link=${pairing.code}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      this.copied.set(true);
    } catch {
      // No clipboard here: the code on screen does the same.
    }
  }

  protected async syncNow(): Promise<void> {
    await this.sync.syncNow();
    await this.loadDevices();
  }

  protected async remove(device: SyncDevice): Promise<void> {
    if (!confirm(this.t().sync.removeConfirm(device.name))) return;
    const reply = await this.sync.removeDevice(device.id);
    if (!reply.ok) this.error.set(this.errorText(reply.code));
    await this.loadDevices();
  }

  protected async turnOff(): Promise<void> {
    if (!confirm(this.t().sync.turnOffConfirm)) return;
    this.pairing.set(null);
    await this.sync.turnOffHere();
  }

  protected async deleteCloud(): Promise<void> {
    if (!confirm(this.t().sync.deleteConfirm)) return;
    this.pairing.set(null);
    const reply = await this.sync.deleteCloudCopy();
    if (!reply.ok) this.error.set(this.errorText(reply.code));
  }

  /** A code read out one character at a time. */
  protected spelled(code: string): string {
    return code.replace('-', '').split('').join(' ');
  }

  protected when(iso: string): string {
    const date = new Date(iso);
    const today = new Date().toDateString() === date.toDateString();
    return today
      ? new Intl.DateTimeFormat(this.i18n.locale(), {
          timeStyle: 'short',
        }).format(date)
      : this.i18n.date(iso);
  }

  private async run(
    action: () => Promise<{ ok: boolean; code?: string }>,
  ): Promise<boolean> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const reply = await action();
      if (!reply.ok) this.error.set(this.errorText(reply.code ?? ''));
      return reply.ok;
    } finally {
      this.busy.set(false);
    }
  }

  private async loadDevices(): Promise<void> {
    const reply = await this.sync.devices();
    if (reply.ok) this.devices.set(reply.devices);
  }

  private deviceName(): string {
    return this.name().trim() || this.t().sync.kinds[deviceKind()];
  }

  private isDefaultName(name: string): boolean {
    // Another language's default: follow the language switch.
    return Object.values(this.t().sync.kinds).includes(name) || name === '';
  }

  private errorText(code: string): string {
    const errors = this.t().sync.errors;
    switch (code) {
      case 'CODE_INVALID':
        return errors.code;
      case 'OFFLINE':
        return errors.network;
      case 'RATE_LIMITED':
        return errors.busy;
      default:
        return errors.unavailable;
    }
  }

  private size(bytes: number): string {
    return bytes >= 1_000_000
      ? `${this.i18n.num(bytes / 1_000_000, 1)} MB`
      : `${this.i18n.num(Math.max(1, bytes / 1000), 0)} KB`;
  }
}
