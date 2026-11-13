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
  STUDYLM_REPOSITORY,
  type StudyLmRepository,
} from './studylm.repository';

export const STUDYLM_TOKEN_SECRET = Symbol('STUDYLM_TOKEN_SECRET');
export const STUDYLM_CLOCK = Symbol('STUDYLM_CLOCK');

export interface AuthenticatedStudyLmDevice {
  deviceId: string;
  tokenExpiresAt: Date;
}

interface StudyLmDeviceRequest {
  headers: Record<string, string | string[] | undefined>;
  studylmDevice?: AuthenticatedStudyLmDevice;
}

const TOUCH_EVERY_MS = 60 * 60_000;

@Injectable()
export class StudyLmDeviceGuard implements CanActivate {
  constructor(
    @Inject(STUDYLM_REPOSITORY)
    private readonly repository: StudyLmRepository,
    @Inject(STUDYLM_TOKEN_SECRET) private readonly secret: string,
    @Inject(STUDYLM_CLOCK) private readonly now: () => Date,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StudyLmDeviceRequest>();
    const header = request.headers['authorization'];
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length).trim()
        : null;
    if (!token) {
      throw new UnauthorizedException('This StudyLM device is not paired.');
    }
    const now = this.now();
    const claims = await verifyDeviceToken(this.secret, token, now);
    const device =
      claims && (await this.repository.findDevice(claims.deviceId));
    if (!claims || !device || device.revokedAt) {
      throw new UnauthorizedException(
        'This StudyLM device link has expired or been removed.',
      );
    }
    if (
      !device.lastSeenAt ||
      now.getTime() - device.lastSeenAt.getTime() >= TOUCH_EVERY_MS
    ) {
      await this.repository.touchDevice(device.id, now);
    }
    request.studylmDevice = {
      deviceId: device.id,
      tokenExpiresAt: claims.expiresAt,
    };
    return true;
  }
}

export const CurrentStudyLmDevice = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedStudyLmDevice => {
    const device = context
      .switchToHttp()
      .getRequest<StudyLmDeviceRequest>().studylmDevice;
    if (!device) {
      throw new UnauthorizedException('This StudyLM device is not paired.');
    }
    return device;
  },
);
