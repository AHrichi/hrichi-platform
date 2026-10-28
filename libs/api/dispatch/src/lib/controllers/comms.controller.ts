import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SendWhatsAppMessageDto } from '../dto/comms.dto';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';
import type {
  WhatsAppMessage,
  ShiftHandoverReport,
} from '@ah/products/dispatch/domain';

@Controller('api/dispatch')
export class DispatchCommsController {
  constructor(private readonly repository: MongoDispatchRepository) {}

  @Get('messages/:channel')
  async listMessages(@Param('channel') channel: string) {
    return this.repository.listMessages(channel);
  }

  @Post('messages')
  async sendMessage(@Body() dto: SendWhatsAppMessageDto) {
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg: WhatsAppMessage = {
      id: `msg_${Date.now()}`,
      channel: dto.channel,
      senderName: dto.senderName || 'Coordinator Desk (You)',
      senderRole: dto.senderRole || 'PulseOps Control',
      text: dto.text.trim(),
      timestamp: nowHhMm,
      isCoordinator: dto.isCoordinator !== undefined ? dto.isCoordinator : true,
    };

    return this.repository.createMessage(newMsg);
  }

  @Post('handovers')
  async saveHandover(@Body() report: ShiftHandoverReport) {
    return this.repository.saveHandover(report);
  }

  @Get('handovers/latest')
  async getLatestHandover() {
    return this.repository.getLatestHandover();
  }
}
