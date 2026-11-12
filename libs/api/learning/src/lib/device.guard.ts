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
  type Device,
  LEARNING_REPOSITORY,
  type LearningRepository,
} from './learning.repository';

export const LEARNING_TOKEN_SECRET = Symbol('LEARNING_TOKEN_SECRET');
export const LEARNING_CLOCK = Symbol('LEARNING_CLOCK');

export interface AuthenticatedDevice {
  deviceId: string;
  tokenExpiresAt: Date;
}

/** A host app's link (design §9): its id and the app it speaks for. */
export interface AuthenticatedHost extends AuthenticatedDevice {
  app: string;
}

interface DeviceRequest {
  headers: Record<string, string | string[] | undefined>;
  learningDevice?: AuthenticatedDevice;
  learningHost?: AuthenticatedHost;
}

/** Updating lastSeenAt at most this often keeps syncs to one write. */
const TOUCH_EVERY_MS = 60 * 60_000;

/**
 * The device record and claims behind a request's token, or a 401. Paired
 * devices and host links share the token format and the devices
 * collection; each guard then checks which one it is.
 */
async function authenticate(
  request: DeviceRequest,
  repository: LearningRepository,
  secret: string,
  now: Date,
): Promise<{ device: Device; expiresAt: Date }> {
  const header = request.headers['authorization'];
  const token =
    typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : null;
  if (!token) {
    throw new UnauthorizedException('This device is not paired.');
  }
  const claims = await verifyDeviceToken(secret, token, now);
  const device = claims && (await repository.findDevice(claims.deviceId));
  if (!claims || !device || device.revokedAt) {
    throw new UnauthorizedException(
      'This device’s pairing has ended. Pair it again.',
    );
  }
  if (
    !device.lastSeenAt ||
    now.getTime() - device.lastSeenAt.getTime() > TOUCH_EVERY_MS
  ) {
    await repository.touchDevice(device.id, now);
  }
  return { device, expiresAt: claims.expiresAt };
}

/**
 * Lets a request through when it carries a valid token for a paired device
 * that hasn't been revoked. A host app's link is refused: it may send
 * cards and answers, never sync the whole engine.
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
    const { device, expiresAt } = await authenticate(
      request,
      this.repository,
      this.secret,
      this.now(),
    );
    if (device.host) {
      throw new UnauthorizedException(
        'This is an app’s link to the Learning Engine, not a paired device.',
      );
    }
    request.learningDevice = {
      deviceId: device.id,
      tokenExpiresAt: expiresAt,
    };
    return true;
  }
}

/** Lets a host app's link through to the host routes, and nothing else. */
@Injectable()
export class HostGuard implements CanActivate {
  constructor(
    @Inject(LEARNING_REPOSITORY)
    private readonly repository: LearningRepository,
    @Inject(LEARNING_TOKEN_SECRET) private readonly secret: string,
    @Inject(LEARNING_CLOCK) private readonly now: () => Date,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DeviceRequest>();
    const { device, expiresAt } = await authenticate(
      request,
      this.repository,
      this.secret,
      this.now(),
    );
    if (!device.host) {
      throw new UnauthorizedException(
        'These routes are for an app linked to the Learning Engine.',
      );
    }
    request.learningHost = {
      deviceId: device.id,
      tokenExpiresAt: expiresAt,
      app: device.host,
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

/** The host link HostGuard let through. */
export const CurrentHost = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedHost => {
    const host = context
      .switchToHttp()
      .getRequest<DeviceRequest>().learningHost;
    if (!host) {
      throw new UnauthorizedException('This app is not linked.');
    }
    return host;
  },
);
