import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DispatchEncryptionService } from '../services/encryption.service';
import type { UserSessionPayload } from '../models/user.model';

export interface AuthenticatedRequest {
  user?: UserSessionPayload;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class DispatchAuthGuard implements CanActivate {
  constructor(private readonly encryptionService: DispatchEncryptionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authentication required (Bearer token missing).',
      );
    }

    const token = authHeader.substring(7).trim();
    const payload = this.encryptionService.verifySessionToken(token);

    if (!payload) {
      throw new UnauthorizedException(
        'Invalid or expired authentication session.',
      );
    }

    request.user = payload;
    return true;
  }
}
