import { type DynamicModule, Module } from '@nestjs/common';
import type { Db } from 'mongodb';
import { MongoStudyLmRepository } from './mongo-studylm.repository';
import {
  STUDYLM_CLOCK,
  STUDYLM_TOKEN_SECRET,
  StudyLmDeviceGuard,
} from './studylm-device.guard';
import {
  STUDYLM_PAIRING_NOTIFIER,
  StudyLmLogPairingNotifier,
  type StudyLmPairingNotifier,
  StudyLmTelegramPairingNotifier,
} from './studylm-pairing-notifier';
import { StudyLmPairingService } from './studylm-pairing.service';
import { StudyLmWriteLock } from './studylm-sync-helpers';
import { StudyLmSyncService } from './studylm-sync.service';
import { StudyLmController } from './studylm.controller';
import {
  STUDYLM_REPOSITORY,
  type StudyLmRepository,
} from './studylm.repository';

export const STUDYLM_MONGO_DB = Symbol('STUDYLM_MONGO_DB');

export interface StudyLmModuleOptions {
  /** Signs StudyLM device tokens; falls back to LEARNING_TOKEN_SECRET on Render. */
  tokenSecret: string;
  /** Where pairing codes go. */
  telegram: { botToken: string; chatId: string } | null;
  /** Development only: log pairing codes instead of sending via Telegram. */
  logPairingCodes: boolean;
}

@Module({})
export class StudyLmModule {
  static register(options: StudyLmModuleOptions): DynamicModule {
    return {
      module: StudyLmModule,
      controllers: [StudyLmController],
      providers: [
        { provide: STUDYLM_TOKEN_SECRET, useValue: options.tokenSecret },
        { provide: STUDYLM_CLOCK, useValue: () => new Date() },
        {
          provide: STUDYLM_REPOSITORY,
          inject: [STUDYLM_MONGO_DB],
          useFactory: async (db: Db) => {
            const repository = new MongoStudyLmRepository(db);
            await repository.ensureIndexes();
            return repository;
          },
        },
        {
          provide: STUDYLM_PAIRING_NOTIFIER,
          useFactory: (): StudyLmPairingNotifier =>
            options.logPairingCodes
              ? new StudyLmLogPairingNotifier()
              : new StudyLmTelegramPairingNotifier(options.telegram),
        },
        {
          provide: StudyLmPairingService,
          inject: [STUDYLM_REPOSITORY, STUDYLM_PAIRING_NOTIFIER, STUDYLM_CLOCK],
          useFactory: (
            repository: StudyLmRepository,
            notifier: StudyLmPairingNotifier,
            now: () => Date,
          ) =>
            new StudyLmPairingService(
              repository,
              notifier,
              options.tokenSecret,
              now,
            ),
        },
        { provide: StudyLmWriteLock, useFactory: () => new StudyLmWriteLock() },
        {
          provide: StudyLmSyncService,
          inject: [STUDYLM_REPOSITORY, STUDYLM_CLOCK, StudyLmWriteLock],
          useFactory: (
            repository: StudyLmRepository,
            now: () => Date,
            lock: StudyLmWriteLock,
          ) =>
            new StudyLmSyncService(repository, options.tokenSecret, now, lock),
        },
        StudyLmDeviceGuard,
      ],
    };
  }
}
