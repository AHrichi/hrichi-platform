import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type DevicePaired,
  type DeviceSummary,
  type PairingConfirm,
  PairingConfirmSchema,
  type PairingStart,
  PairingStartSchema,
  type PairingStarted,
  type SyncRequest,
  SyncRequestSchema,
  type SyncResponse,
} from '@ah/learning/domain';
import {
  type AuthenticatedDevice,
  CurrentDevice,
  DeviceGuard,
} from './device.guard';
import { PairingService } from './pairing.service';
import { SyncService } from './sync.service';
import { ValibotPipe } from './valibot.pipe';

@Controller('learning')
export class LearningController {
  constructor(
    @Inject(PairingService) private readonly pairing: PairingService,
    @Inject(SyncService) private readonly syncService: SyncService,
  ) {}

  /** Sends a code to the owner's Telegram. */
  @Post('pairing')
  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  startPairing(
    @Body(new ValibotPipe(PairingStartSchema)) body: PairingStart,
  ): Promise<PairingStarted> {
    return this.pairing.start(body.deviceName);
  }

  @Post('pairing/:id/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 10 * 60_000 } })
  confirmPairing(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValibotPipe(PairingConfirmSchema)) body: PairingConfirm,
  ): Promise<DevicePaired> {
    return this.pairing.confirm(id, body.code);
  }

  @Post('sync')
  @HttpCode(200)
  @UseGuards(DeviceGuard)
  sync(
    @CurrentDevice() device: AuthenticatedDevice,
    @Body(new ValibotPipe(SyncRequestSchema)) body: SyncRequest,
  ): Promise<SyncResponse> {
    return this.syncService.sync(device, body);
  }

  @Get('devices')
  @UseGuards(DeviceGuard)
  devices(
    @CurrentDevice() device: AuthenticatedDevice,
  ): Promise<DeviceSummary[]> {
    return this.pairing.list(device.deviceId);
  }

  @Delete('devices/:id')
  @HttpCode(204)
  @UseGuards(DeviceGuard)
  revoke(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.pairing.revoke(id);
  }
}
