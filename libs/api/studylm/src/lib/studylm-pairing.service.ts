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
import { signDeviceToken } from '@ah/learning/domain';
import {
  STUDYLM_PAIRING,
  type StudyLmDevicePaired,
  type StudyLmDeviceSummary,
  type StudyLmPairingStarted,
} from '@ah/products/studylm/domain';
import type { StudyLmPairingNotifier } from './studylm-pairing-notifier';
import type { StudyLmRepository } from './studylm.repository';

function hashCode(pairingId: string, code: string): string {
  return createHash('sha256').update(`${pairingId}:${code}`).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

export class StudyLmPairingService {
  constructor(
    private readonly repository: StudyLmRepository,
    private readonly notifier: StudyLmPairingNotifier,
    private readonly tokenSecret: string,
    private readonly now: () => Date = () => new Date(),
    private readonly newCode: () => string = () =>
      randomInt(0, 10 ** STUDYLM_PAIRING.codeLength)
        .toString()
        .padStart(STUDYLM_PAIRING.codeLength, '0'),
  ) {}

  async start(deviceName: string): Promise<StudyLmPairingStarted> {
    if (!this.notifier.enabled) {
      throw new ServiceUnavailableException(
        'StudyLM pairing needs the Telegram bot, which is not configured on this server.',
      );
    }
    const id = randomUUID();
    const code = this.newCode();
    const expiresAt = new Date(this.now().getTime() + STUDYLM_PAIRING.ttlMs);
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

  async confirm(pairingId: string, code: string): Promise<StudyLmDevicePaired> {
    const pairing = await this.repository.findPairing(pairingId);
    const now = this.now();
    if (!pairing || pairing.expiresAt.getTime() <= now.getTime()) {
      throw new NotFoundException(
        'This pairing has expired. Ask for a new code.',
      );
    }
    if (!sameHash(pairing.codeHash, hashCode(pairingId, code))) {
      const attempts = await this.repository.recordFailedAttempt(pairingId);
      if (attempts >= STUDYLM_PAIRING.maxAttempts) {
        await this.repository.deletePairing(pairingId);
        throw new NotFoundException(
          'Too many wrong codes. Ask for a new code.',
        );
      }
      throw new BadRequestException(
        `That code is wrong. ${STUDYLM_PAIRING.maxAttempts - attempts} tries left.`,
      );
    }
    await this.repository.deletePairing(pairingId);

    const deviceId = randomUUID();
    const expiresAt = new Date(now.getTime() + STUDYLM_PAIRING.tokenTtlMs);
    await this.repository.createDevice({
      id: deviceId,
      name: pairing.deviceName,
      pairedAt: now,
      lastSeenAt: now,
      revokedAt: null,
    });
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

  async list(currentDeviceId: string): Promise<StudyLmDeviceSummary[]> {
    const devices = await this.repository.listDevices();
    return devices
      .filter((device) => !device.revokedAt)
      .map((device) => ({
        id: device.id,
        name: device.name,
        pairedAt: device.pairedAt.toISOString(),
        lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
        current: device.id === currentDeviceId,
      }));
  }

  async revoke(deviceId: string): Promise<void> {
    if (!(await this.repository.revokeDevice(deviceId, this.now()))) {
      throw new NotFoundException('No paired StudyLM device has that id.');
    }
  }
}
