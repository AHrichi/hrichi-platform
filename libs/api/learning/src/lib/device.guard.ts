import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyDeviceToken } from '@ah/learning/domain';
import {
  LEARNING_REPOSITORY,
  type LearningRepository,
} from './learning.repository';

export const LEARNING_TOKEN_SECRET = Symbol('LEARNING_TOKEN_SECRET');
export const LEARNING_CLOCK = Symbol('LEARNING_CLOCK');

export interface AuthenticatedDevice {
  deviceId: string;
  tokenExpiresAt: Date;
}

interface DeviceRequest {
  headers: Record<string, string | string[] | undefined>;
  learningDevice?: AuthenticatedDevice;
}

/** Updating lastSeenAt at most this often keeps syncs to one write. */
const TOUCH_EVERY_MS = 60 * 60_000;

/**
 * Lets a request through when it carries a valid device token for a device
 * that hasn't been revoked.
 */
@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(
    @Inject(LEARNING_REPOSITORY)
    private readonly repository: LearningRepository,
    @Inject(LEARNING_TOKEN_SECRET) private readonly secret: string,
    @Inject(LEARNING_CLOCK) private readonly now: () => Date,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DeviceRequest>();
    const header = request.headers['authorization'];
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length).trim()
        : null;
    if (!token) {
      throw new UnauthorizedException('This device is not paired.');
    }
    const now = this.now();
    const claims = await verifyDeviceToken(this.secret, token, now);
    const device =
      claims && (await this.repository.findDevice(claims.deviceId));
    if (!claims || !device || device.revokedAt) {
      throw new UnauthorizedException(
        'This device’s pairing has ended. Pair it again.',
      );
    }
    if (
      !device.lastSeenAt ||
      now.getTime() - device.lastSeenAt.getTime() > TOUCH_EVERY_MS
    ) {
      await this.repository.touchDevice(device.id, now);
    }
    request.learningDevice = {
      deviceId: claims.deviceId,
      tokenExpiresAt: claims.expiresAt,
    };
    return true;
  }
}

/** The device DeviceGuard let through. */
export const CurrentDevice = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedDevice => {
    const device = context
      .switchToHttp()
      .getRequest<DeviceRequest>().learningDevice;
    if (!device) throw new UnauthorizedException('This device is not paired.');
    return device;
  },
);
