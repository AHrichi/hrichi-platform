import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LeadsModule } from '@ah/api/leads';
import { DispatchModule } from '@ah/api/dispatch';
import type { ApiConfig } from './config';
import { HealthController } from './health.controller';
import { MongoModule } from './mongo.module';

@Module({})
export class AppModule {
  static forRoot(config: ApiConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Coarse limit for every route; /leads sets a stricter one.
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
        ScheduleModule.forRoot(),
        MongoModule.forRoot(config.mongo),
        LeadsModule.register(config.leads),
        DispatchModule.register(config.dispatch),
      ],
      controllers: [HealthController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    };
  }
}
