import { DynamicModule, Module } from '@nestjs/common';
import type { Db } from 'mongodb';
import { DispatchEncryptionService } from './services/encryption.service';
import { DispatchQuotaService } from './services/quota.service';
import { MongoDispatchRepository } from './repositories/mongo-dispatch.repository';
import { DispatchAuthGuard } from './guards/dispatch-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { DispatchAuthController } from './controllers/auth.controller';
import { DispatchOrdersController } from './controllers/orders.controller';
import { DispatchDriversController } from './controllers/drivers.controller';
import { DispatchPlantsController } from './controllers/plants.controller';
import { DispatchStockController } from './controllers/stock.controller';
import { DispatchCommsController } from './controllers/comms.controller';
import { DispatchAdminController } from './controllers/admin.controller';

export const DISPATCH_MONGO_DB = Symbol('DISPATCH_MONGO_DB');

export interface DispatchModuleOptions {
  authSecret?: string;
  encryptionKey?: string;
}

@Module({})
export class DispatchModule {
  static register(options?: DispatchModuleOptions): DynamicModule {
    return {
      module: DispatchModule,
      controllers: [
        DispatchAuthController,
        DispatchOrdersController,
        DispatchDriversController,
        DispatchPlantsController,
        DispatchStockController,
        DispatchCommsController,
        DispatchAdminController,
      ],
      providers: [
        {
          provide: DispatchEncryptionService,
          useFactory: () => new DispatchEncryptionService(options),
        },
        DispatchQuotaService,
        {
          provide: MongoDispatchRepository,
          inject: [
            DISPATCH_MONGO_DB,
            DispatchEncryptionService,
            DispatchQuotaService,
          ],
          useFactory: async (
            db: Db,
            encryption: DispatchEncryptionService,
            quota: DispatchQuotaService,
          ) => {
            const repo = new MongoDispatchRepository(db, encryption, quota);
            await repo.ensureIndexes();
            return repo;
          },
        },
        DispatchAuthGuard,
        RolesGuard,
      ],
      exports: [
        DispatchEncryptionService,
        DispatchQuotaService,
        MongoDispatchRepository,
      ],
    };
  }
}
