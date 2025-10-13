# DevOps Overview

This is the authoritative, up-to-date guide for OrangeCat DevOps. It summarizes environments, CI/CD, infrastructure, observability, security, and runbooks for both human engineers and AI coding agents.

- Read first: Deployment guide – docs/operations/DEPLOYMENT.md
- CI/CD Pipeline – docs/devops/ci-cd.md
- Infrastructure (Vercel + optional self-hosted) – docs/devops/infrastructure.md
- Observability (Health, Metrics, Logs) – docs/devops/observability.md
- Runbooks (Backups/Restores) – docs/devops/runbooks/backup-restore.md
 - Supabase Connectivity – docs/devops/supabase.md

Source of truth notes:
- Node.js: v20 across workflows and Docker.
- Tests and type-checks are blocking in CI with pragmatic coverage gates.
- Security: strict headers + CSP (reporting enabled), SVG disabled unless sanitized.
