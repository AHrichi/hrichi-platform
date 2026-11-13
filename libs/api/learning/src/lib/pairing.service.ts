import {
  createHash,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  type DevicePaired,
  type DeviceSummary,
  PAIRING,
  type PairingStarted,
  signDeviceToken,
} from '@ah/learning/domain';
import type { EdgeDeviceSync } from './edge-devices';
import type { LearningRepository } from './learning.repository';
import type { PairingNotifier } from './pairing-notifier';

function hashCode(pairingId: string, code: string): string {
  return createHash('sha256').update(`${pairingId}:${code}`).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Pairs a device with the owner's account (design §11): a code goes to the
 * owner's Telegram, the owner types it into the device, and the device gets
 * a signed token. Five wrong codes end the pairing.
 */
export class PairingService {
  constructor(
    private readonly repository: LearningRepository,
    private readonly notifier: PairingNotifier,
    private readonly tokenSecret: string,
    private readonly now: () => Date = () => new Date(),
    private readonly newCode: () => string = () =>
      randomInt(0, 10 ** PAIRING.codeLength)
        .toString()
        .padStart(PAIRING.codeLength, '0'),
    private readonly edgeDevices: EdgeDeviceSync | null = null,
  ) {}

  async start(deviceName: string): Promise<PairingStarted> {
    if (!this.notifier.enabled) {
      throw new ServiceUnavailableException(
        'Pairing needs the Telegram bot, which this server has no settings for.',
      );
    }
    const id = randomUUID();
    const code = this.newCode();
    const expiresAt = new Date(this.now().getTime() + PAIRING.ttlMs);
    await this.repository.createPairing({
      id,
      deviceName,
      codeHash: hashCode(id, code),
      expiresAt,
      attempts: 0,
    });
    try {
      await this.notifier.sendCode(deviceName, code, expiresAt);
    } catch {
      await this.repository.deletePairing(id);
      throw new ServiceUnavailableException(
        'The pairing code could not be sent to Telegram. Try again.',
      );
    }
    return { pairingId: id, expiresAt: expiresAt.toISOString() };
  }

  async confirm(pairingId: string, code: string): Promise<DevicePaired> {
    const pairing = await this.repository.findPairing(pairingId);
    const now = this.now();
    if (!pairing || pairing.expiresAt.getTime() <= now.getTime()) {
      throw new NotFoundException(
        'This pairing has expired. Ask for a new code.',
      );
    }
    if (!sameHash(pairing.codeHash, hashCode(pairingId, code))) {
      const attempts = await this.repository.recordFailedAttempt(pairingId);
      if (attempts >= PAIRING.maxAttempts) {
        await this.repository.deletePairing(pairingId);
        throw new NotFoundException(
          'Too many wrong codes. Ask for a new code.',
        );
      }
      throw new BadRequestException(
        `That code is wrong. ${PAIRING.maxAttempts - attempts} tries left.`,
      );
    }
    await this.repository.deletePairing(pairingId);

    const deviceId = randomUUID();
    const expiresAt = new Date(now.getTime() + PAIRING.tokenTtlMs);
    await this.repository.createDevice({
      id: deviceId,
      name: pairing.deviceName,
      host: null,
      pairedAt: now,
      lastSeenAt: now,
      revokedAt: null,
    });
    await this.edgeDevices?.pushDevices();
    const token = await signDeviceToken(this.tokenSecret, {
      deviceId,
      expiresAt,
    });
    return {
      deviceId,
      deviceName: pairing.deviceName,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async list(currentDeviceId: string): Promise<DeviceSummary[]> {
    const devices = await this.repository.listDevices();
    return devices
      .filter((device) => !device.revokedAt)
      .map((device) => ({
        id: device.id,
        name: device.name,
        pairedAt: device.pairedAt.toISOString(),
        lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
        host: device.host,
        current: device.id === currentDeviceId,
      }));
  }

  async revoke(deviceId: string): Promise<void> {
    if (!(await this.repository.revokeDevice(deviceId, this.now()))) {
      throw new NotFoundException('No paired device has that id.');
    }
    await this.edgeDevices?.pushDevices();
  }
}
