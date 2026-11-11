import { BadRequestException, type PipeTransform } from '@nestjs/common';
import * as v from 'valibot';

/**
 * Validates a body against a valibot schema from `@ah/learning/domain`, so
 * the browser and the API check requests with the same contract. Use it on
 * parameters typed with an interface: the global ValidationPipe only
 * validates class-typed parameters and lets these through untouched.
 */
export class ValibotPipe<
  TSchema extends v.GenericSchema,
> implements PipeTransform<unknown, v.InferOutput<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): v.InferOutput<TSchema> {
    const result = v.safeParse(this.schema, value);
    if (result.success) return result.output;
    throw new BadRequestException({
      message: 'The request does not match the contract.',
      issues: result.issues.slice(0, 20).map((issue) => ({
        path: v.getDotPath(issue),
        message: issue.message,
      })),
    });
  }
}
