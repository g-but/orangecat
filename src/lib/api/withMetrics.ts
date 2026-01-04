import { recordHttpMetrics, getMetricsRegistry } from '@/lib/metrics'

export function withMetrics(route: string, handler: (req: Request) => Promise<Response>) {
  return async function(req: Request): Promise<Response> {
    const start = Date.now()
    let res: Response
    try {
      res = await handler(req)
      return res
    } finally {
      const duration = Date.now() - start
      // Request method is available on Request object
      const method = req.method || 'GET'
      // Response status is available on Response object
      const status = res?.status || 200
      // Initialize registry if needed
      await getMetricsRegistry().catch(() => {})
      await recordHttpMetrics({ method, route, status, durationMs: duration })
    }
  }
}

