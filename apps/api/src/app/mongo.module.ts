import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { MONGO_DB } from '@ah/api/leads';
import { DISPATCH_MONGO_DB } from '@ah/api/dispatch';
import { LEARNING_MONGO_DB } from '@ah/api/learning';
import { STUDYLM_MONGO_DB } from '@ah/api/studylm';

export const MONGO_CLIENT = Symbol('MONGO_CLIENT');

/** One MongoClient for the process; it connects on first use. */
@Global()
@Module({})
export class MongoModule implements OnApplicationShutdown {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  static forRoot(options: { uri: string; dbName: string }): DynamicModule {
    return {
      module: MongoModule,
      providers: [
        {
          provide: MONGO_CLIENT,
          useFactory: () =>
            new MongoClient(options.uri, {
              appName: 'ahmed-hrichi-api',
              serverSelectionTimeoutMS: 10_000,
            }),
        },
        {
          provide: MONGO_DB,
          inject: [MONGO_CLIENT],
          useFactory: (client: MongoClient) => client.db(options.dbName),
        },
        {
          provide: DISPATCH_MONGO_DB,
          inject: [MONGO_CLIENT],
          useFactory: (client: MongoClient) => client.db(options.dbName),
        },
        {
          provide: LEARNING_MONGO_DB,
          inject: [MONGO_CLIENT],
          useFactory: (client: MongoClient) => client.db(options.dbName),
        },
        {
          provide: STUDYLM_MONGO_DB,
          inject: [MONGO_CLIENT],
          useFactory: (client: MongoClient) => client.db(options.dbName),
        },
      ],
      exports: [
        MONGO_CLIENT,
        MONGO_DB,
        DISPATCH_MONGO_DB,
        LEARNING_MONGO_DB,
        STUDYLM_MONGO_DB,
      ],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
