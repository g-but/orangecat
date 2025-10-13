# Infrastructure

Primary: Vercel (Next.js app + serverless API). Vercel config in `vercel.json` + `next.config.js`.

Optional Self-Hosted Stack (for on-prem / advanced monitoring)
- Compose file: `deployment/production/docker-compose.yml`
- Services: Traefik, web (Next.js standalone), Postgres, Redis, Prometheus, Loki, Promtail, Grafana, scheduled Postgres backups.
- Monitoring configs: `deployment/production/monitoring/` (Prometheus, Loki, Promtail, Grafana datasources).

Security
- Traefik dashboard should not be public; restrict by network/VPN.
- Postgres/Redis are bound to `127.0.0.1` and internal network only.
- Pin versions for all infra images to avoid drift.

Backups
- `prodrigestivill/postgres-backup-local` runs on a schedule with retention.
- See runbook for restoration procedure.

