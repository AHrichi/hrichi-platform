import {
  BadGatewayException,
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import * as v from 'valibot';
import { LadderExhaustedError } from '@ah/api/ai';
import {
  type Capture,
  type Concept,
  MAX_INSTRUCTION,
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
import { CapturePipeline, PipelineError } from './capture-pipeline';
import {
  type GradeRequest,
  GradeRequestSchema,
  type GradeResponse,
  GradingService,
  type TeachBackRequest,
  TeachBackRequestSchema,
  type TeachBackResponse,
} from './grading.service';
import { PairingService } from './pairing.service';
import { SyncService } from './sync.service';
import { ValibotPipe } from './valibot.pipe';

/** Voice notes are at most 2 minutes of opus: well under this. */
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
/** A teach-back is about a minute (TEACH_BACK_SECONDS caps it at 90 s). */
export const MAX_TEACH_AUDIO_BYTES = 2 * 1024 * 1024;

/** What multer hands over for one uploaded file. */
interface UploadedAudio {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const ReviseRequestSchema = v.strictObject({
  instruction: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(MAX_INSTRUCTION),
  ),
  expectedVersion: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
});
type ReviseRequest = v.InferOutput<typeof ReviseRequestSchema>;

@Controller('learning')
export class LearningController {
  constructor(
    @Inject(PairingService) private readonly pairing: PairingService,
    @Inject(SyncService) private readonly syncService: SyncService,
    @Inject(CapturePipeline) private readonly pipeline: CapturePipeline,
    @Inject(GradingService) private readonly grading: GradingService,
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

  /** A voice note's audio, after its capture has synced (design §7). */
  @Post('captures/:id/audio')
  @HttpCode(202)
  @UseGuards(DeviceGuard)
  @Throttle({ default: { limit: 30, ttl: 60 * 60_000 } })
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
    }),
  )
  async uploadAudio(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile() file: UploadedAudio | undefined,
  ): Promise<Capture> {
    if (!file?.buffer?.length || !file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('Send the voice note as an "audio" file.');
    }
    return this.aiCall(() =>
      this.pipeline.receiveAudio(id, {
        bytes: new Uint8Array(file.buffer),
        mimeType: file.mimetype,
      }),
    );
  }

  /** "Make it simpler" and other rewrites of a concept's explanation. */
  @Post('concepts/:id/revise')
  @HttpCode(200)
  @UseGuards(DeviceGuard)
  @Throttle({ default: { limit: 20, ttl: 60 * 60_000 } })
  revise(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValibotPipe(ReviseRequestSchema)) body: ReviseRequest,
  ): Promise<Concept> {
    return this.aiCall(() =>
      this.pipeline.revise(id, body.instruction, body.expectedVersion),
    );
  }

  /** A typed answer, graded by its key points (design §6.3). */
  @Post('grade')
  @HttpCode(200)
  @UseGuards(DeviceGuard)
  @Throttle({ default: { limit: 120, ttl: 60 * 60_000 } })
  grade(
    @Body(new ValibotPipe(GradeRequestSchema)) body: GradeRequest,
  ): Promise<GradeResponse> {
    return this.aiCall(() => this.grading.grade(body));
  }

  /** A teach-back's recording, as text, so the learner sees what was heard. */
  @Post('transcribe')
  @HttpCode(200)
  @UseGuards(DeviceGuard)
  @Throttle({ default: { limit: 30, ttl: 60 * 60_000 } })
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: MAX_TEACH_AUDIO_BYTES, files: 1 },
    }),
  )
  transcribe(
    @UploadedFile() file: UploadedAudio | undefined,
  ): Promise<{ text: string }> {
    if (!file?.buffer?.length || !file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('Send the recording as an "audio" file.');
    }
    return this.aiCall(async () => ({
      text: await this.grading.transcribe({
        bytes: new Uint8Array(file.buffer),
        mimeType: file.mimetype,
      }),
    }));
  }

  /** A teach-back, judged by its key points and clarity (design §6.3). */
  @Post('teach-back')
  @HttpCode(200)
  @UseGuards(DeviceGuard)
  @Throttle({ default: { limit: 30, ttl: 60 * 60_000 } })
  teachBack(
    @Body(new ValibotPipe(TeachBackRequestSchema)) body: TeachBackRequest,
  ): Promise<TeachBackResponse> {
    return this.aiCall(() => this.grading.teachBack(body));
  }

  private async aiCall<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof PipelineError) {
        if (error.reason === 'not_found') {
          throw new NotFoundException(error.message);
        }
        if (error.reason === 'conflict') {
          throw new ConflictException(error.message);
        }
        if (error.reason === 'unavailable') {
          throw new ServiceUnavailableException(error.message);
        }
        throw new BadGatewayException(error.message);
      }
      if (error instanceof LadderExhaustedError) {
        throw new BadGatewayException(
          'The AI is busy or unreachable. Try again in a minute.',
        );
      }
      throw new BadGatewayException(
        error instanceof Error ? error.message : 'The AI call failed.',
      );
    }
  }
}
