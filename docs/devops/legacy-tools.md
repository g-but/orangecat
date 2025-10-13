# Legacy/Helper Tools

This repository contains several helper scripts created during earlier iterations. The authoritative deployment path is GitHub Actions → Vercel (see docs/devops/ci-cd.md). Treat the scripts below as optional developer conveniences, not production deployment paths.

Status
- `w` (root): Convenience script to git add/commit/push and open Actions dashboard. Keep as developer convenience; not required for deploys.
- `scripts/deployment/one-button-deploy.js`: Invokes the GitHub Actions deployment; okay to use, but the primary path is push/merge to `main`.
- `scripts/mcp-github-server.js`: Updated to trigger `one-button-deploy.yml`. Consider this an advanced operator tool.
- `scripts/deployment/verify-deployment-setup.js`: Verifies deployment prerequisites. Updated to reference current docs.

Avoid
- Any references to non-existent `smart-deploy.yml` workflow (kept only as a conflict check).
- Manual `vercel deploy` for production (use the workflow).

