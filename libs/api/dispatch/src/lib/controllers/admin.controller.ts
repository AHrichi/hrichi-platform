import { Controller, Get, Post } from '@nestjs/common';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';

@Controller('api/dispatch/admin')
export class DispatchAdminController {
  constructor(private readonly repository: MongoDispatchRepository) {}

  @Get('quota')
  async getQuota() {
    return this.repository.getQuotaStatus();
  }

  @Post('seed-sample-data')
  async seedData() {
    await this.repository.seedSampleData();
    return {
      success: true,
      message:
        'London LP Laundry demonstration operational data successfully seeded into MongoDB Atlas cluster.',
    };
  }

  @Post('clear-data')
  async clearData() {
    await this.repository.clearAllData();
    return {
      success: true,
      message:
        'Operational collections cleared to clean slate. Zero items in database.',
    };
  }
}
