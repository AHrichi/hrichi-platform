import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DeliveryService } from './delivery.service';

/**
 * Retries failed deliveries every minute while the API is awake. When the
 * free instance sleeps, n8n's backstop workflow reads pending leads from
 * MongoDB directly (ADR-0010).
 */
@Injectable()
export class OutboxScheduler {
  private readonly logger = new Logger(OutboxScheduler.name);
  private running = false;

  constructor(
    @Inject(DeliveryService) private readonly delivery: DeliveryService,
  ) {}

  @Interval(60_000)
  async sweep(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const attempts = await this.delivery.sweep();
      if (attempts > 0) {
        this.logger.log(`Retried ${attempts} lead deliveries`);
      }
    } catch (error) {
      this.logger.error('Outbox sweep failed', error as Error);
    } finally {
      this.running = false;
    }
  }
}
