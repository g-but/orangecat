import { ZodSchema } from 'zod';
import type { Middleware } from './compose';
import { apiValidationError } from './standardResponse';

export interface ZodContext<T> {
  body?: T;
}

export function withZodBody<T>(schema: ZodSchema<T>): Middleware<ZodContext<T>> {
  return async (req, ctx, next) => {
    try {
      const json = await req.json();
      const parsed = schema.parse(json);
      ctx.body = parsed;
      return next(req, ctx);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Zod errors include .errors array
      const details = err?.errors || err?.message;
      return apiValidationError('Invalid request body', details);
    }
  };
}
