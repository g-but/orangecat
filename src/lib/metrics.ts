let promClient: any = null
let registry: any = null
let initialized = false

// Lazily initialize prom-client and default metrics
export async function getMetricsRegistry() {
  // Hard gate: if metrics are not enabled, never attempt to import
  if (process.env.METRICS_ENABLED !== 'true') {
    return { prom: null, registry: null }
  }
  if (initialized && registry) return { prom: promClient, registry }
  try {
    // Dynamic import via variable to avoid static resolution at build time
    const moduleName = 'prom-client'
    // @ts-ignore - dynamic spec prevents bundler static resolution
    promClient = await import(moduleName)
    registry = new promClient.Registry()
    promClient.collectDefaultMetrics({ register: registry })

    // HTTP metrics
    const httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status']
    })
    const httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
    })

    registry.registerMetric(httpRequestsTotal)
    registry.registerMetric(httpRequestDuration)

    // Export for use
    (globalThis as any).__oc_metrics = { prom: promClient, registry, httpRequestsTotal, httpRequestDuration }
    initialized = true
    return { prom: promClient, registry }
  } catch (e) {
    // Metrics not available
    initialized = false
    return { prom: null, registry: null }
  }
}

export async function recordHttpMetrics(params: { method: string; route: string; status: number; durationMs: number }) {
  if (!(globalThis as any).__oc_metrics) return
  const { httpRequestsTotal, httpRequestDuration } = (globalThis as any).__oc_metrics
  const labels = { method: params.method, route: params.route, status: String(params.status) }
  try {
    httpRequestsTotal.inc(labels, 1)
    httpRequestDuration.observe(labels, params.durationMs / 1000)
  } catch {
    // no-op if registry not ready
  }
}
