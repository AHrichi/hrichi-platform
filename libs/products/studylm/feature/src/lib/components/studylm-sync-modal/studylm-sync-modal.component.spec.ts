import '@angular/compiler';
import {
  APP_ID,
  Injector,
  PendingTasks,
  signal,
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
} from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import {
  StudyLmSyncService,
  type StudyLmSyncStatus,
} from '../../services/studylm-sync.service';
import { StudyLmSyncModalComponent } from './studylm-sync-modal.component';

function createModal(status: StudyLmSyncStatus = 'unpaired') {
  const noop = () => undefined;
  const startPairing = vi.fn().mockResolvedValue(undefined);
  const confirmPairing = vi.fn().mockResolvedValue(true);
  const cancelPairing = vi.fn();
  const syncNow = vi.fn().mockResolvedValue(undefined);
  const revokeDevice = vi.fn().mockResolvedValue(undefined);
  const closeModal = vi.fn();

  const injector = Injector.create({
    providers: [
      { provide: APP_ID, useValue: 'studylm-test' },
      { provide: PendingTasks, useValue: { add: () => noop } },
      { provide: ɵChangeDetectionScheduler, useValue: { notify: noop } },
      { provide: ɵEffectScheduler, useValue: { add: noop } },
      {
        provide: StudyLmSyncService,
        useValue: {
          status: signal<StudyLmSyncStatus>(status),
          device: signal(null),
          lastSyncAt: signal<string | null>(null),
          errorMessage: signal<string | null>(null),
          lastPullSummary: signal(null),
          devices: signal([]),
          devicesLoading: signal(false),
          pairing: signal({
            pairingId: null,
            expiresAt: null,
            busy: false,
            error: null,
          }),
          startPairing,
          confirmPairing,
          cancelPairing,
          syncNow,
          revokeDevice,
          closeModal,
        },
      },
      StudyLmSyncModalComponent,
    ],
  });

  return {
    modal: injector.get(StudyLmSyncModalComponent),
    startPairing,
    confirmPairing,
    revokeDevice,
    closeModal,
  };
}

describe('StudyLmSyncModalComponent', () => {
  it('maps sync status to badge variant and submits device pairing', async () => {
    const { modal, startPairing, confirmPairing, closeModal } =
      createModal('synced');
    expect(modal.badge().variant).toBe('success');

    modal.nameModel.set({ name: 'Study Laptop' });
    await modal.sendCode();
    expect(startPairing).toHaveBeenCalledWith('Study Laptop');

    modal.codeModel.set({ code: '123456' });
    await modal.pair();
    expect(confirmPairing).toHaveBeenCalledWith('123456');

    modal.close();
    expect(closeModal).toHaveBeenCalled();
  });

  it('asks for confirmation before revoking a paired device', async () => {
    const { modal, revokeDevice } = createModal('synced');
    const originalConfirm = globalThis.confirm;
    const confirmMock = vi
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    globalThis.confirm = confirmMock;

    try {
      await modal.revoke('dev-1', false);
      expect(revokeDevice).not.toHaveBeenCalled();

      await modal.revoke('dev-1', true);
      expect(confirmMock).toHaveBeenCalledTimes(2);
      expect(revokeDevice).toHaveBeenCalledWith('dev-1');
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });
});
