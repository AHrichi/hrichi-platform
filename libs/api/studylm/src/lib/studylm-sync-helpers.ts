import { BadRequestException, type PipeTransform } from '@nestjs/common';
import * as v from 'valibot';

export class StudyLmWriteLock {
  private queue: Promise<unknown> = Promise.resolve();

  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.catch(() => undefined);
    return result;
  }
}

export class StudyLmValibotPipe<
  TSchema extends v.GenericSchema,
> implements PipeTransform<unknown, v.InferOutput<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): v.InferOutput<TSchema> {
    const result = v.safeParse(this.schema, value);
    if (result.success) return result.output;
    throw new BadRequestException({
      message: 'The request does not match the StudyLM contract.',
      issues: result.issues.slice(0, 20).map((issue) => ({
        path: v.getDotPath(issue),
        message: issue.message,
      })),
    });
  }
}
