import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CapturePipeline } from './capture-pipeline';
import { TelegramInbox } from './telegram-inbox';

/**
 * Runs the capture queue at boot and every 5 minutes while the API is
 * awake, after pulling what Telegram brought (design §9). Captures sent
 * while Render slept are processed on its next wake; nothing keeps it
 * awake (architecture §10).
 */
@Injectable()
export class PipelineScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(PipelineScheduler.name);

  constructor(
    @Inject(CapturePipeline) private readonly pipeline: CapturePipeline,
    @Inject(TelegramInbox) private readonly inbox: TelegramInbox,
  ) {}

  onApplicationBootstrap(): void {
    void this.run();
  }

  @Interval(5 * 60_000)
  async run(): Promise<void> {
    if (this.inbox.configured) {
      try {
        await this.inbox.pull();
      } catch (error) {
        this.logger.warn(`Telegram inbox not pulled: ${String(error)}`);
      }
    }
    try {
      await this.pipeline.sweep();
    } catch (error) {
      this.logger.error('Capture sweep failed', error as Error);
    }
  }
}
