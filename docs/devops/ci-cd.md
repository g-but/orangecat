# CI/CD Pipeline

Primary workflow: `.github/workflows/one-button-deploy.yml`

Stages
- Setup Node 20 + npm cache
- Install dependencies (`npm ci`)
- Lint (`npm run lint`)
- Type-check (`npm run type-check`)
- Tests (blocking) with coverage (`npm run test:ci`)
- Build (`npm run build`)
- Deploy to Vercel via CLI (prod when `main`)
- Health check + optional Lighthouse audit

Inputs
- `environment`: `production`|`staging` (defaults to `production`)
- `skip_tests`: boolean – for emergency only
- `force_deploy`: boolean – bypasses some checks (avoid except emergencies)

Secrets
- `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN` – used by Vercel CLI

Standards
- Node: `20.x` everywhere
- Coverage thresholds: pragmatic (see `jest.config.js`); raise over time
- Do not commit `.env.local`; use Vercel/GitHub secrets
 - Protect `main` branch: require status checks (CI pass), disallow direct pushes, require PR reviews
