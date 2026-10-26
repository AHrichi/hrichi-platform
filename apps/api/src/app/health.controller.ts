import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Db } from 'mongodb';
import { MONGO_DB } from '@ah/api/leads';

/**
 * Render's health check and the site's pre-warm ping. Always 200 while the
 * process runs, so a database blip doesn't make Render restart the service.
 */
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}

  @Get()
  async check(): Promise<{
    status: 'ok';
    db: 'up' | 'down';
    uptimeSeconds: number;
  }> {
    let timer: NodeJS.Timeout | undefined;
    const db = await Promise.race([
      this.db.command({ ping: 1 }).then(() => 'up' as const),
      new Promise<'down'>((resolve) => {
        timer = setTimeout(() => resolve('down'), 2000);
      }),
    ])
      .catch(() => 'down' as const)
      .finally(() => clearTimeout(timer));
    return { status: 'ok', db, uptimeSeconds: Math.round(process.uptime()) };
  }
}
