import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'

export type Handler<Ctx = any> = (
  req: NextRequest,
  ctx: Ctx
) => Promise<NextResponse> | NextResponse

export type Middleware<Ctx = any> = (
  req: NextRequest,
  ctx: Ctx,
  next: Handler<Ctx>
) => Promise<NextResponse> | NextResponse

export function compose<Ctx = any>(...middlewares: Middleware<Ctx>[]) {
  return function wrap(handler: Handler<Ctx>): Handler<Ctx> {
    return async function composed(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
      let index = -1
      const run = async (i: number, r: NextRequest, c: Ctx): Promise<NextResponse> => {
        if (i <= index) throw new Error('next() called multiple times')
        index = i
        const mw = middlewares[i]
        if (!mw) return handler(r, c)
        return mw(r, c, (nr = r, nc = c) => run(i + 1, nr, nc))
      }
      return run(0, req, ctx)
    }
  }
}
