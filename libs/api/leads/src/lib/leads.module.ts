import { DynamicModule, Module } from '@nestjs/common';
import type { Db } from 'mongodb';
import {
  LEAD_CHANNELS,
  LeadChannel,
  N8nChannel,
  TelegramChannel,
} from './channels';
import { DeliveryService } from './delivery.service';
import {
  HUMAN_VERIFIER,
  HumanVerifier,
  TurnstileVerifier,
} from './human-verifier';
import { LeadsController } from './leads.controller';
import { LEADS_REPOSITORY, LeadsRepository } from './leads.repository';
import { LeadsService } from './leads.service';
import { MongoLeadsRepository } from './mongo-leads.repository';
import { OutboxScheduler } from './outbox.scheduler';

/** Provided by the app: the MongoDB database the leads collection lives in. */
export const MONGO_DB = Symbol('MONGO_DB');

export interface LeadsModuleOptions {
  turnstileSecret: string;
  telegram: { botToken: string; chatId: string } | null;
  n8n: { webhookUrl: string; secret: string } | null;
}

@Module({})
export class LeadsModule {
  static register(options: LeadsModuleOptions): DynamicModule {
    return {
      module: LeadsModule,
      controllers: [LeadsController],
      providers: [
        {
          provide: LEADS_REPOSITORY,
          inject: [MONGO_DB],
          useFactory: async (db: Db) => {
            const repository = new MongoLeadsRepository(db.collection('leads'));
            await repository.ensureIndexes();
            return repository;
          },
        },
        {
          provide: LEAD_CHANNELS,
          useFactory: (): LeadChannel[] => [
            new TelegramChannel(options.telegram),
            new N8nChannel(options.n8n),
          ],
        },
        {
          provide: HUMAN_VERIFIER,
          useFactory: () => new TurnstileVerifier(options.turnstileSecret),
        },
        {
          provide: DeliveryService,
          inject: [LEADS_REPOSITORY, LEAD_CHANNELS],
          useFactory: (repository: LeadsRepository, channels: LeadChannel[]) =>
            new DeliveryService(repository, channels),
        },
        {
          provide: LeadsService,
          inject: [
            LEADS_REPOSITORY,
            HUMAN_VERIFIER,
            DeliveryService,
            LEAD_CHANNELS,
          ],
          useFactory: (
            repository: LeadsRepository,
            verifier: HumanVerifier,
            delivery: DeliveryService,
            channels: LeadChannel[],
          ) => new LeadsService(repository, verifier, delivery, channels),
        },
        OutboxScheduler,
      ],
    };
  }
}
