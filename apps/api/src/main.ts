import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { loadConfig } from './app/config';
import { configureApp } from './app/configure-app';

async function bootstrap() {
  const config = loadConfig();
  const app = configureApp(
    await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config)),
    config,
  );
  await app.listen(config.port, '0.0.0.0');
  // Set when Nx waits for this server to be ready
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      // Function keeps TypeScript and bundlers from rewriting or bundling the import
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // @nx/js isn't installed
    }
  }
  Logger.log(`API listening on port ${config.port}`);
}

bootstrap().catch((error) => {
  Logger.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
