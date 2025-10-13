# Observability

Health
- `GET /api/health` returns overall status and dependency checks (Supabase, Redis), 200 when healthy/degraded, 503 when unhealthy.

Metrics (Prometheus)
- `GET /api/metrics` (enable with `METRICS_ENABLED=true`; optional bearer `METRICS_TOKEN`).
- Default Node metrics + `orangecat_app_up` gauge.
- Prometheus scrape configured in `deployment/production/monitoring/prometheus.yml`.
 - HTTP request metrics: `http_requests_total` and `http_request_duration_seconds` via a lightweight wrapper (`src/lib/api/withMetrics.ts`). Example usage wired into `/api/health`.

Logs (Loki + Promtail)
- Promtail scrapes Docker JSON logs and ships to Loki.
- Grafana dashboards/datasources provisioned under `deployment/production/monitoring/grafana/`.

CSP Reporting
- Enforced CSP with optional report-only mirror to `/api/csp-report`.
- Review CSP reports periodically and tighten sources.
 - Toggle report-only via `CSP_REPORT_ONLY=true` in the build environment.
