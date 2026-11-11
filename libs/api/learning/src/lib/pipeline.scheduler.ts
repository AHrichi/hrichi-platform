import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CapturePipeline } from './capture-pipeline';

/**
 * Runs the capture queue at boot and every 5 minutes while the API is
 * awake. Captures sent while Render slept are processed on its next wake;
 * nothing keeps it awake (architecture §10).
 */
@Injectable()
export class PipelineScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(PipelineScheduler.name);

  constructor(
    @Inject(CapturePipeline) private readonly pipeline: CapturePipeline,
  ) {}

  onApplicationBootstrap(): void {
    void this.run();
  }

  @Interval(5 * 60_000)
  async run(): Promise<void> {
    try {
      await this.pipeline.sweep();
    } catch (error) {
      this.logger.error('Capture sweep failed', error as Error);
    }
  }
}
