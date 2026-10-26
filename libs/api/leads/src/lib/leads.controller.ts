import { Body, Controller, HttpCode, Inject, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { LeadResponse } from '@ah/shared/contracts';
import { CreateLeadDto } from './create-lead.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(@Inject(LeadsService) private readonly leads: LeadsService) {}

  /** 202: the lead is stored; delivery to Telegram and n8n may still be retrying. */
  @Post()
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  create(@Body() lead: CreateLeadDto, @Ip() ip: string): Promise<LeadResponse> {
    return this.leads.create(lead, ip);
  }
}
