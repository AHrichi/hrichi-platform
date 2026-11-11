import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { PAIRING } from '@ah/learning/domain';
import { AhAlert, AhButton } from '@ah/ui';
import { guessDeviceName } from '../../store/device-name';
import { LearningStore } from '../../store/learning.store';

/**
 * Pairing and devices (design §11). The code goes to the owner's Telegram,
 * never to this screen: only someone who can read that chat can pair.
 */
@Component({
  selector: 'lrn-devices-screen',
  imports: [AhAlert, AhButton, DatePipe, FormField, FormRoot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './devices-screen.html',
  styleUrl: './devices-screen.scss',
})
export class DevicesScreen {
  protected readonly store = inject(LearningStore);

  protected readonly nameModel = signal({
    name:
      this.store.pairing().deviceName ||
      guessDeviceName(globalThis.navigator?.userAgent ?? ''),
  });
  protected readonly nameForm = form(
    this.nameModel,
    (path) => {
      required(path.name, { message: 'Name this device.' });
      maxLength(path.name, PAIRING.deviceName);
    },
    { submission: { action: () => this.sendCode() } },
  );

  protected readonly codeModel = signal({ code: '' });
  protected readonly codeForm = form(
    this.codeModel,
    (path) => {
      required(path.code, { message: 'Type the 6-digit code.' });
      pattern(path.code, /^\d{6}$/, { message: 'The code has 6 digits.' });
      maxLength(path.code, PAIRING.codeLength);
    },
    { submission: { action: () => this.pair() } },
  );

  constructor() {
    // Once this device is paired, list every paired device.
    effect(() => {
      if (this.store.device()) void this.store.loadDevices();
    });
  }

  private async sendCode(): Promise<undefined> {
    this.store.setDeviceName(this.nameModel().name.trim());
    await this.store.startPairing();
    this.codeForm().reset({ code: '' });
    return undefined;
  }

  private async pair(): Promise<undefined> {
    await this.store.confirmPairing(this.codeModel().code);
    return undefined;
  }

  protected remove(id: string, name: string, current: boolean): void {
    const question = current
      ? 'Unpair this device? Its concepts stay here but stop syncing.'
      : `Remove “${name}”? It stops syncing until it is paired again.`;
    if (globalThis.confirm?.(question)) void this.store.removeDevice(id);
  }
}
