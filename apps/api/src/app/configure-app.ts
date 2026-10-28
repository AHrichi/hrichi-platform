import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import type { ApiConfig } from './config';

/** Everything main.ts applies to the app, shared with the HTTP tests. */
export function configureApp(
  app: NestExpressApplication,
  config: ApiConfig,
): NestExpressApplication {
  // Render terminates TLS in front of the app; trust it for the client IP.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-requested-with'],
    maxAge: 86_400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  return app;
}
