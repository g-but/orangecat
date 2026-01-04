import type { Middleware } from './compose'

interface GlobalWithCrypto extends Global {
  crypto?: {
    randomUUID?: () => string;
  };
}

export function withRequestId(): Middleware<any> {
  return async (req, ctx, next) => {
    const globalWithCrypto = globalThis as GlobalWithCrypto;
    const requestId = globalWithCrypto.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    const res = await next(req, { ...(ctx || {}), requestId })
    try {
      res.headers.set('X-Request-Id', requestId)
    } catch {
      // ignore header set failures
    }
    return res
  }
}

