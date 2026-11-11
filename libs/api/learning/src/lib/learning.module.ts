import { type DynamicModule, Module } from '@nestjs/common';
import type { Db } from 'mongodb';
import { type AiKeys, buildAiProviders } from '@ah/api/ai';
import { CapturePipeline } from './capture-pipeline';
import {
  DeviceGuard,
  LEARNING_CLOCK,
  LEARNING_TOKEN_SECRET,
} from './device.guard';
import { LearningController } from './learning.controller';
import {
  LEARNING_REPOSITORY,
  type LearningRepository,
} from './learning.repository';
import { MongoLearningRepository } from './mongo-learning.repository';
import {
  LogPairingNotifier,
  PAIRING_NOTIFIER,
  type PairingNotifier,
  TelegramPairingNotifier,
} from './pairing-notifier';
import { PairingService } from './pairing.service';
import { PipelineScheduler } from './pipeline.scheduler';
import { SyncService } from './sync.service';
import { WriteLock } from './write-lock';

/** Provided by the app: the MongoDB database the learning collections live in. */
export const LEARNING_MONGO_DB = Symbol('LEARNING_MONGO_DB');

export interface LearningModuleOptions {
  /** Signs device tokens; at least 32 characters (MIN_SECRET_LENGTH). */
  tokenSecret: string;
  /** Where pairing codes go. */
  telegram: { botToken: string; chatId: string } | null;
  /** Development only: log pairing codes instead of sending them. */
  logPairingCodes: boolean;
  /** Model provider keys; without any, captures wait (design §6). */
  ai: AiKeys;
}

@Module({})
export class LearningModule {
  static register(options: LearningModuleOptions): DynamicModule {
    return {
      module: LearningModule,
      controllers: [LearningController],
      providers: [
        { provide: LEARNING_TOKEN_SECRET, useValue: options.tokenSecret },
        { provide: LEARNING_CLOCK, useValue: () => new Date() },
        {
          provide: LEARNING_REPOSITORY,
          inject: [LEARNING_MONGO_DB],
          useFactory: async (db: Db) => {
            const repository = new MongoLearningRepository(db);
            await repository.ensureIndexes();
            return repository;
          },
        },
        {
          provide: PAIRING_NOTIFIER,
          useFactory: (): PairingNotifier =>
            options.logPairingCodes
              ? new LogPairingNotifier()
              : new TelegramPairingNotifier(options.telegram),
        },
        {
          provide: PairingService,
          inject: [LEARNING_REPOSITORY, PAIRING_NOTIFIER, LEARNING_CLOCK],
          useFactory: (
            repository: LearningRepository,
            notifier: PairingNotifier,
            now: () => Date,
          ) =>
            new PairingService(repository, notifier, options.tokenSecret, now),
        },
        { provide: WriteLock, useValue: new WriteLock() },
        {
          provide: CapturePipeline,
          inject: [LEARNING_REPOSITORY, WriteLock, LEARNING_CLOCK],
          useFactory: (
            repository: LearningRepository,
            lock: WriteLock,
            now: () => Date,
          ) =>
            new CapturePipeline(
              repository,
              lock,
              buildAiProviders(options.ai),
              now,
            ),
        },
        {
          provide: SyncService,
          inject: [
            LEARNING_REPOSITORY,
            LEARNING_CLOCK,
            WriteLock,
            CapturePipeline,
          ],
          useFactory: (
            repository: LearningRepository,
            now: () => Date,
            lock: WriteLock,
            pipeline: CapturePipeline,
          ) =>
            new SyncService(repository, options.tokenSecret, now, lock, () => {
              void pipeline.kick();
            }),
        },
        PipelineScheduler,
        DeviceGuard,
      ],
    };
  }
}
