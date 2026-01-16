// Type definitions for prom-client (dynamically imported)
interface PromClient {
  Registry: new () => Registry;
  Counter: new (config: CounterConfig) => Counter;
  Histogram: new (config: HistogramConfig) => Histogram;
  collectDefaultMetrics: (options: { register: Registry }) => void;
}

interface Registry {
  registerMetric(metric: Counter | Histogram): void;
}

interface Counter {
  inc(labels: Record<string, string>, value?: number): void;
}

interface Histogram {
  observe(labels: Record<string, string>, value: number): void;
}

interface CounterConfig {
  name: string;
  help: string;
  labelNames: string[];
}

interface HistogramConfig {
  name: string;
  help: string;
  labelNames: string[];
  buckets: number[];
}

interface MetricsStore {
  prom: PromClient;
  registry: Registry;
  httpRequestsTotal: Counter;
  httpRequestDuration: Histogram;
}

let promClient: PromClient | null = null
let registry: Registry | null = null
let initialized = false

// Lazily initialize prom-client and default metrics
export async function getMetricsRegistry() {
  // Hard gate: if metrics are not enabled, never attempt to import
  if (process.env.METRICS_ENABLED !== 'true') {
    return { prom: null, registry: null }
  }
  if (initialized && registry) {return { prom: promClient, registry }}
  try {
    // Dynamic import via variable to avoid static resolution at build time
    const moduleName = 'prom-client'
    // Type assertion needed because dynamic import with variable doesn't preserve types
    promClient = await import(moduleName) as unknown as PromClient
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

    // Export for use - extend globalThis with our metrics store type
    const metricsStore: MetricsStore = { prom: promClient, registry, httpRequestsTotal, httpRequestDuration }
    ;(globalThis as typeof globalThis & { __oc_metrics?: MetricsStore }).__oc_metrics = metricsStore
    initialized = true
    return { prom: promClient, registry }
  } catch {
    // Metrics not available
    initialized = false
    return { prom: null, registry: null }
  }
}

export async function recordHttpMetrics(params: { method: string; route: string; status: number; durationMs: number }) {
  const metricsStore = (globalThis as typeof globalThis & { __oc_metrics?: MetricsStore }).__oc_metrics
  if (!metricsStore) {return}
  const { httpRequestsTotal, httpRequestDuration } = metricsStore
  const labels = { method: params.method, route: params.route, status: String(params.status) }
  try {
    httpRequestsTotal.inc(labels, 1)
    httpRequestDuration.observe(labels, params.durationMs / 1000)
  } catch {
    // no-op if registry not ready
  }
}
