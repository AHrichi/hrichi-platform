import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  MIN_SECRET_LENGTH,
  PAIRING,
  verifyDeviceToken,
} from '@ah/learning/domain';
import { PairingService } from './pairing.service';
import { FakePairingNotifier } from './testing/fakes';
import { InMemoryLearningRepository } from './testing/in-memory-learning.repository';

const secret = 'p'.repeat(MIN_SECRET_LENGTH);

function setup(notifier = new FakePairingNotifier()) {
  const repository = new InMemoryLearningRepository();
  let now = new Date('2026-11-11T09:00:00Z');
  const service = new PairingService(repository, notifier, secret, () => now);
  return {
    repository,
    notifier,
    service,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    now: () => now,
  };
}

describe('PairingService', () => {
  it('sends the code to Telegram, then pairs with it', async () => {
    const { service, notifier, repository, now } = setup();
    const started = await service.start('Pixel 8');
    expect(notifier.sent).toEqual([
      { deviceName: 'Pixel 8', code: expect.stringMatching(/^\d{6}$/) },
    ]);
    // The code is never stored, only its hash.
    const stored = repository.pairings.get(started.pairingId);
    expect(JSON.stringify(stored)).not.toContain(notifier.lastCode);

    const paired = await service.confirm(started.pairingId, notifier.lastCode);
    expect(paired.deviceName).toBe('Pixel 8');
    const claims = await verifyDeviceToken(secret, paired.token, now());
    expect(claims?.deviceId).toBe(paired.deviceId);
    expect(repository.pairings.size).toBe(0);
    // A code works once.
    await expect(
      service.confirm(started.pairingId, notifier.lastCode),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ends the pairing after five wrong codes', async () => {
    const { service, notifier } = setup();
    const { pairingId } = await service.start('Laptop');
    const wrong = notifier.lastCode === '000000' ? '111111' : '000000';
    for (let i = 1; i < PAIRING.maxAttempts; i++) {
      await expect(service.confirm(pairingId, wrong)).rejects.toThrow(
        `${PAIRING.maxAttempts - i} tries left`,
      );
    }
    await expect(service.confirm(pairingId, wrong)).rejects.toThrow(
      /Too many wrong codes/,
    );
    await expect(
      service.confirm(pairingId, notifier.lastCode),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses an expired code', async () => {
    const { service, notifier, advance } = setup();
    const { pairingId } = await service.start('Laptop');
    advance(PAIRING.ttlMs);
    await expect(
      service.confirm(pairingId, notifier.lastCode),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('says so when Telegram is missing or failing, leaving nothing behind', async () => {
    const off = setup(new FakePairingNotifier(false));
    await expect(off.service.start('Laptop')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    const failing = setup(new FakePairingNotifier(true, true));
    await expect(failing.service.start('Laptop')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(failing.repository.pairings.size).toBe(0);
  });

  it('lists and revokes devices', async () => {
    const { service, notifier } = setup();
    const pair = async (name: string) => {
      const { pairingId } = await service.start(name);
      return service.confirm(pairingId, notifier.lastCode);
    };
    const phone = await pair('Phone');
    const laptop = await pair('Laptop');

    const listed = await service.list(phone.deviceId);
    expect(listed.map((device) => [device.name, device.current])).toEqual([
      ['Phone', true],
      ['Laptop', false],
    ]);

    await service.revoke(laptop.deviceId);
    expect((await service.list(phone.deviceId)).map((d) => d.name)).toEqual([
      'Phone',
    ]);
    await expect(service.revoke(laptop.deviceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a wrong code with a 400, not a 404', async () => {
    const { service, notifier } = setup();
    const { pairingId } = await service.start('Laptop');
    const wrong = notifier.lastCode === '123456' ? '654321' : '123456';
    await expect(service.confirm(pairingId, wrong)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
