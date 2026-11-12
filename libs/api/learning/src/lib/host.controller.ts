import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type {
  HostAnswersResult,
  HostCapturesResult,
  HostLinked,
  HostState,
} from '@ah/learning/contracts';
import {
  type HostAnswersRequestBody,
  HostAnswersRequestSchema,
  type HostCapturesRequestBody,
  HostCapturesRequestSchema,
  type HostLinkRequestBody,
  HostLinkRequestSchema,
  TimeZoneSchema,
} from '@ah/learning/domain';
import {
  type AuthenticatedHost,
  CurrentHost,
  DeviceGuard,
  HostGuard,
} from './device.guard';
import { HostService } from './host.service';
import { ValibotPipe } from './valibot.pipe';

/**
 * Linked hosts (design §9). A paired device issues a host app's link; the
 * link then reaches only these routes: send cards, report answers, read
 * progress, unlink.
 */
@Controller('learning')
export class HostController {
  constructor(@Inject(HostService) private readonly hosts: HostService) {}

  /** From the learning app's "Link StudyLM" screen, on a paired device. */
  @Post('hosts')
  @UseGuards(DeviceGuard)
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  link(
    @Body(new ValibotPipe(HostLinkRequestSchema)) body: HostLinkRequestBody,
  ): Promise<HostLinked> {
    return this.hosts.link(body);
  }

  @Post('host/captures')
  @HttpCode(200)
  @UseGuards(HostGuard)
  captures(
    @CurrentHost() host: AuthenticatedHost,
    @Body(new ValibotPipe(HostCapturesRequestSchema))
    body: HostCapturesRequestBody,
  ): Promise<HostCapturesResult> {
    return this.hosts.addCaptures(host, body);
  }

  @Post('host/answers')
  @HttpCode(200)
  @UseGuards(HostGuard)
  answers(
    @CurrentHost() host: AuthenticatedHost,
    @Body(new ValibotPipe(HostAnswersRequestSchema))
    body: HostAnswersRequestBody,
  ): Promise<HostAnswersResult> {
    return this.hosts.addAnswers(host, body);
  }

  @Get('host/state')
  @UseGuards(HostGuard)
  state(
    @CurrentHost() host: AuthenticatedHost,
    @Query('timeZone', new ValibotPipe(TimeZoneSchema)) timeZone: string,
  ): Promise<HostState> {
    return this.hosts.state(host, timeZone);
  }

  @Delete('host')
  @HttpCode(204)
  @UseGuards(HostGuard)
  unlink(@CurrentHost() host: AuthenticatedHost): Promise<void> {
    return this.hosts.unlink(host);
  }
}
