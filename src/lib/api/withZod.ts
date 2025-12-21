import { ZodSchema } from 'zod'
import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import type { Handler, Middleware } from './compose'
import { apiValidationError } from './standardResponse'

export interface ZodContext<T> {
  body?: T
}

export function withZodBody<T>(schema: ZodSchema<T>): Middleware<ZodContext<T>> {
  return async (req, ctx, next) => {
    try {
      const json = await req.json()
      const parsed = schema.parse(json)
      ctx.body = parsed
      return next(req, ctx)
    } catch (err: any) {
      // Zod errors include .errors array
      const details = err?.errors || err?.message
      return apiValidationError('Invalid request body', details)
    }
  }
}

