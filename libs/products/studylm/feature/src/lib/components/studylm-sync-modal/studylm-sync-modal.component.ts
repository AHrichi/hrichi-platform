import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { STUDYLM_PAIRING } from '@ah/products/studylm/domain';
import { PreferencesStore } from '@ah/shared/state';
import { AhAlert, AhBadge, AhButton, AhModal } from '@ah/ui';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';
import {
  guessStudyLmDeviceName,
  StudyLmSyncService,
} from '../../services/studylm-sync.service';

@Component({
  selector: 'ah-studylm-sync-modal',
  standalone: true,
  imports: [DatePipe, FormField, FormRoot, AhAlert, AhBadge, AhButton, AhModal],
  templateUrl: './studylm-sync-modal.component.html',
  styleUrl: './studylm-sync-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyLmSyncModalComponent {
  readonly sync = inject(StudyLmSyncService);
  private readonly preferences = inject(PreferencesStore, { optional: true });

  readonly copy = computed(
    () => STUDYLM_COPY[this.preferences?.language() ?? 'en'].sync,
  );
  readonly revokingId = signal<string | null>(null);

  readonly badge = computed<{
    variant: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
    label: string;
  }>(() => {
    const c = this.copy();
    switch (this.sync.status()) {
      case 'synced':
        return { variant: 'success', label: c.badgeSynced };
      case 'syncing':
        return { variant: 'accent', label: c.badgeSyncing };
      case 'offline':
        return { variant: 'warning', label: c.badgeOffline };
      case 'failed':
        return { variant: 'danger', label: c.badgeFailed };
      default:
        return { variant: 'neutral', label: c.badgeUnpaired };
    }
  });

  readonly nameModel = signal({
    name: guessStudyLmDeviceName(globalThis.navigator?.userAgent ?? ''),
  });
  readonly nameForm = form(
    this.nameModel,
    (path) => {
      required(path.name, { message: this.copy().deviceNameLabel });
      maxLength(path.name, STUDYLM_PAIRING.deviceNameMax);
    },
    { submission: { action: () => this.sendCode() } },
  );

  readonly codeModel = signal({ code: '' });
  readonly codeForm = form(
    this.codeModel,
    (path) => {
      required(path.code, { message: this.copy().codeLabel });
      pattern(path.code, /^\d{6}$/, { message: this.copy().codeLabel });
      maxLength(path.code, STUDYLM_PAIRING.codeLength);
    },
    { submission: { action: () => this.pair() } },
  );

  async sendCode(): Promise<undefined> {
    const raw = this.nameModel().name.trim();
    if (!raw) return undefined;
    await this.sync.startPairing(raw);
    this.codeForm().reset({ code: '' });
    return undefined;
  }

  async pair(): Promise<undefined> {
    await this.sync.confirmPairing(this.codeModel().code.trim());
    return undefined;
  }

  async revoke(id: string, current: boolean): Promise<void> {
    const promptText = current
      ? this.copy().revokeThisConfirm
      : this.copy().revokeOtherConfirm;
    const confirmed = globalThis.confirm
      ? globalThis.confirm(promptText)
      : true;
    if (!confirmed) return;

    this.revokingId.set(id);
    try {
      await this.sync.revokeDevice(id);
    } finally {
      this.revokingId.set(null);
    }
  }

  syncNow(): void {
    void this.sync.syncNow();
  }

  close(): void {
    this.sync.closeModal();
  }
}
