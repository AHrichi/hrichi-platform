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
  type StudyLmDevicePaired,
  type StudyLmDeviceSummary,
  type StudyLmPairingConfirm,
  StudyLmPairingConfirmSchema,
  type StudyLmPairingStart,
  StudyLmPairingStartSchema,
  type StudyLmPairingStarted,
  type StudyLmSyncRequest,
  StudyLmSyncRequestSchema,
  type StudyLmSyncResponse,
} from '@ah/products/studylm/domain';
import {
  type AuthenticatedStudyLmDevice,
  CurrentStudyLmDevice,
  StudyLmDeviceGuard,
} from './studylm-device.guard';
import { StudyLmPairingService } from './studylm-pairing.service';
import { StudyLmValibotPipe } from './studylm-sync-helpers';
import { StudyLmSyncService } from './studylm-sync.service';

@Controller('studylm')
export class StudyLmController {
  constructor(
    @Inject(StudyLmPairingService)
    private readonly pairing: StudyLmPairingService,
    @Inject(StudyLmSyncService)
    private readonly syncService: StudyLmSyncService,
  ) {}

  /** Sends a 6-digit pairing code to the owner's Telegram. */
  @Post('pairing')
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  startPairing(
    @Body(new StudyLmValibotPipe(StudyLmPairingStartSchema))
    body: StudyLmPairingStart,
  ): Promise<StudyLmPairingStarted> {
    return this.pairing.start(body.deviceName);
  }

  @Post('pairing/:id/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 10 * 60_000 } })
  confirmPairing(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new StudyLmValibotPipe(StudyLmPairingConfirmSchema))
    body: StudyLmPairingConfirm,
  ): Promise<StudyLmDevicePaired> {
    return this.pairing.confirm(id, body.code);
  }

  @Post('sync')
  @HttpCode(200)
  @UseGuards(StudyLmDeviceGuard)
  sync(
    @CurrentStudyLmDevice() device: AuthenticatedStudyLmDevice,
    @Body(new StudyLmValibotPipe(StudyLmSyncRequestSchema))
    body: StudyLmSyncRequest,
  ): Promise<StudyLmSyncResponse> {
    return this.syncService.sync(device, body);
  }

  @Get('devices')
  @UseGuards(StudyLmDeviceGuard)
  devices(
    @CurrentStudyLmDevice() device: AuthenticatedStudyLmDevice,
  ): Promise<StudyLmDeviceSummary[]> {
    return this.pairing.list(device.deviceId);
  }

  @Delete('devices/:id')
  @HttpCode(204)
  @UseGuards(StudyLmDeviceGuard)
  revoke(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.pairing.revoke(id);
  }
}
